/* Lift Nutrientes - Subcategorías automáticas de Proteínas
   Mantiene Ganadores de peso fuera de esta clasificación.
*/
(function () {
  'use strict';

  const SUBCATS = [
    { id: 'whey', label: 'Whey Protein' },
    { id: 'isolate', label: 'Isolate / Proteína limpia' },
    { id: 'hydrolyzed', label: 'Hydrolyzed' },
    { id: 'vegan', label: 'Veganas' },
    { id: 'beef', label: 'Proteína de carne' },
    { id: 'other', label: 'Otras fuentes' }
  ];

  function norm(v) {
    return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function proteinSubtype(product) {
    const text = norm([
      product && product.name,
      product && product.nombre,
      product && product.title,
      product && product.producto,
      product && product.presentation,
      product && product.presentacion,
      product && product.brand,
      product && product.marca,
      product && product.category,
      product && product.categoria
    ].filter(Boolean).join(' '));

    // Ganadores ya tienen categoría propia y no se reclasifican aquí.
    if (/mass|gainer|ganador|weight gain|serious mass|super mass|true mass|mutant mass|mass tech|carnivor mass/.test(text)) return null;

    if (/vegan|vegana|plant protein|plant based|pea protein|rice protein|proteina vegetal|arveja|guisante/.test(text)) return 'vegan';
    if (/beef|carne|carnivor(?! mass)|hydrobeef/.test(text)) return 'beef';
    if (/hydroly|hidroliz|iso100|hydro whey|platinum hydro/.test(text)) return 'hydrolyzed';
    if (/isolate|isolat|aislad|isopure|iso whey|iso-whey|iso hd|iso sensation|iso surge|r1 protein/.test(text)) return 'isolate';
    if (/egg|huevo|casein|caseina|albumin|albumina/.test(text)) return 'other';
    return 'whey';
  }

  // API global para que el catálogo pueda usar la misma clasificación en filtros,
  // tarjetas y futuras automatizaciones sin duplicar reglas.
  window.LiftProteinCategories = {
    categories: SUBCATS,
    classify: proteinSubtype,
    classifyAll(products) {
      return (products || []).map(p => Object.assign({}, p, { proteinSubtype: proteinSubtype(p) }));
    }
  };
})();

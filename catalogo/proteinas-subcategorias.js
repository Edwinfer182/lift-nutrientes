(() => {
  const SUBCATEGORIES = [
    { name: 'Proteína hidrolizada', keywords: ['sascha','sasha','sascha fitness','hydrolyzed','hydrolysed','hydro whey','hydro'] },
    { name: 'Proteína vegana', keywords: ['vegan','plant protein','plant-based','pea','arveja','rice protein','proteina de arroz','soya','soy','vegetal'] },
    { name: 'Proteína de carne', keywords: ['beef','carnivor','carne'] },
    { name: 'Proteína de otras fuentes', keywords: ['casein','caseina','micellar','egg','huevo','albumin','albumina'] },
    { name: 'Proteína aislada / limpia', keywords: ['iso triple zero','triple zero','iso100','iso 100','isolate','isolated','isolation','isopure','iso whey','whey iso','isolate 100','zero carb','low carb'] },
    { name: 'Proteína Whey', keywords: ['whey','gold standard','syntha','combat','nitro tech','nitrotech'] }
  ];

  const MASS_TERMS = ['gainer','ganador de peso','ganadores de peso','mass','serious mass','true mass','bulk','super mass','pro gainer'];
  const EXCLUDED_FROM_PROTEINS = ['amino build','creatine chews','maca root','nac 600','ultimate pre workout','protein bar','protein bars','barra de proteina','barras de proteina'];
  const PROTEIN_CATEGORY_TERMS = ['protein','proteina','proteinas'];

  const normalize = value => String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const textOf = product => normalize(`${product?.name || ''} ${product?.brand || ''} ${product?.category || ''} ${Array.isArray(product?.tags) ? product.tags.join(' ') : (product?.tags || '')}`);
  const includesAny = (value, terms) => terms.some(term => normalize(value).includes(normalize(term)));
  const isMassGainer = product => includesAny(textOf(product), MASS_TERMS);
  const isExcludedFromProteins = product => includesAny(textOf(product), EXCLUDED_FROM_PROTEINS);
  const looksLikeProteinCategory = category => {
    const value = normalize(category);
    return PROTEIN_CATEGORY_TERMS.some(term => value.includes(term));
  };

  const classifyProduct = product => {
    if (isMassGainer(product) || isExcludedFromProteins(product)) return null;
    const haystack = textOf(product);
    for (const group of SUBCATEGORIES) {
      if (group.keywords.some(keyword => haystack.includes(normalize(keyword)))) return group.name;
    }
    return 'Proteína Whey';
  };

  window.LIFT_PROTEIN_SUBCATEGORIES = SUBCATEGORIES.map(group => group.name);
  window.LIFT_PROTEIN_CLASSIFIER = { normalize, isMassGainer, isExcludedFromProteins, looksLikeProteinCategory, classifyProduct };

  function applyToCatalog() {
    try {
      if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) return false;

      const oldProteinCategories = new Set();
      let changed = 0;

      for (const product of PRODUCTS) {
        if (!looksLikeProteinCategory(product?.category)) continue;
        if (isMassGainer(product)) continue;
        if (isExcludedFromProteins(product)) {
          product.category = 'Otros suplementos';
          changed++;
          continue;
        }

        oldProteinCategories.add(product.category);
        const nextCategory = classifyProduct(product);
        if (nextCategory && product.category !== nextCategory) {
          product.category = nextCategory;
          changed++;
        }
      }

      if (typeof cats !== 'undefined' && Array.isArray(cats)) {
        const nextCats = cats.filter(category => !oldProteinCategories.has(category));
        for (const group of SUBCATEGORIES) {
          if (!nextCats.includes(group.name)) nextCats.push(group.name);
        }
        if (PRODUCTS.some(product => product.category === 'Otros suplementos') && !nextCats.includes('Otros suplementos')) nextCats.push('Otros suplementos');
        cats.splice(0, cats.length, ...nextCats);
      }

      if (typeof F !== 'undefined' && F?.cats instanceof Set) {
        for (const oldCategory of oldProteinCategories) F.cats.delete(oldCategory);
      }

      if (typeof renderFilters === 'function') renderFilters();
      if (typeof render === 'function') render();

      document.documentElement.dataset.liftProteinSubcategories = 'ready';
      console.info(`[Lift] Proteínas reclasificadas: ${changed}`);
      return true;
    } catch (error) {
      console.error('[Lift] No se pudieron aplicar las subcategorías de proteína', error);
      return false;
    }
  }

  if (!applyToCatalog()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyToCatalog, { once: true });
    } else {
      setTimeout(applyToCatalog, 0);
    }
  }
})();

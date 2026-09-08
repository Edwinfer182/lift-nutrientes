(() => {
  const SUBCATEGORIES = [
    { name: 'Proteína hidrolizada', keywords: ['sascha','sasha','sascha fitness','hydrolyzed','hydrolysed','hydro whey','hydro'] },
    { name: 'Proteína vegana', keywords: ['vegan','plant protein','plant-based','pea','arveja','rice protein','proteina de arroz','soya','soy','vegetal'] },
    { name: 'Proteína de carne', keywords: ['beef','carnivor','carne'] },
    { name: 'Proteína de otras fuentes', keywords: ['casein','caseina','micellar','egg','huevo','albumin','albumina'] },
    { name: 'Proteína aislada / limpia', keywords: ['itholate','iso-xp','iso xp','iso triple zero','triple zero','iso100','iso 100','isolate','isolated','isolation','aislado 100% suero','aislado','isopure','iso whey','whey iso','isolate 100','zero carb','low carb'] },
    { name: 'Proteína Whey', keywords: ['whey','gold standard','syntha','combat','nitro tech','nitrotech'] }
  ];

  const MASS_TERMS = ['gainer','ganador de peso','ganadores de peso','mass','serious mass','true mass','bulk','super mass','pro gainer'];
  const EXCLUDED_FROM_PROTEINS = ['amino build','creatine chews','maca root','nac 600','ultimate pre workout','protein bar','protein bars','barra de proteina','barras de proteina','crispy bar','integralmedica crispy'];
  const PROTEIN_CATEGORY_TERMS = ['protein','proteina','proteinas'];
  const AMINO_CATEGORY_TERMS = ['aminoacidos','aminoácidos','bcaa / eaa','bcaa/eaa','bcaa','eaa'];
  const EAA_TERMS = [' eaa ',' eaa+ ',' eaa+','eaa ','eaas','aminoacidos esenciales','aminoácidos esenciales','essential amino'];

  const normalize = value => String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const textOf = product => normalize(`${product?.name || ''} ${product?.brand || ''} ${product?.category || ''} ${Array.isArray(product?.tags) ? product.tags.join(' ') : (product?.tags || '')}`);
  const includesAny = (value, terms) => terms.some(term => normalize(value).includes(normalize(term)));
  const isMassGainer = product => includesAny(textOf(product), MASS_TERMS);
  const isExcludedFromProteins = product => includesAny(textOf(product), EXCLUDED_FROM_PROTEINS);
  const looksLikeProteinCategory = category => {
    const value = normalize(category);
    return PROTEIN_CATEGORY_TERMS.some(term => value.includes(normalize(term)));
  };
  const looksLikeAminoCategory = category => {
    const value = normalize(category);
    return AMINO_CATEGORY_TERMS.some(term => value === normalize(term));
  };
  const isEAA = product => {
    const name = ` ${normalize(product?.name || product?.title || '')} `;
    return EAA_TERMS.some(term => name.includes(` ${normalize(term)} `) || name.includes(normalize(term)));
  };

  const classifyProduct = product => {
    if (isMassGainer(product) || isExcludedFromProteins(product)) return null;
    const haystack = textOf(product);
    for (const group of SUBCATEGORIES) {
      if (group.keywords.some(keyword => haystack.includes(normalize(keyword)))) return group.name;
    }
    return 'Proteína Whey';
  };

  const dedupeProducts = products => {
    const seen = new Set();
    let removed = 0;
    for (let i = products.length - 1; i >= 0; i--) {
      const product = products[i];
      const key = normalize(product?.name || product?.title || '');
      if (!key) continue;
      if (seen.has(key)) {
        products.splice(i, 1);
        removed++;
      } else {
        seen.add(key);
      }
    }
    return removed;
  };

  window.LIFT_PROTEIN_SUBCATEGORIES = SUBCATEGORIES.map(group => group.name);
  window.LIFT_PROTEIN_CLASSIFIER = { normalize, isMassGainer, isExcludedFromProteins, looksLikeProteinCategory, classifyProduct };

  function applyToCatalog() {
    try {
      if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) return false;

      const duplicatesRemoved = dedupeProducts(PRODUCTS);
      const oldProteinCategories = new Set();
      let changed = 0;

      for (const product of PRODUCTS) {
        if (looksLikeAminoCategory(product?.category)) {
          const nextAminoCategory = isEAA(product) ? 'EAA' : 'Aminoácidos';
          if (product.category !== nextAminoCategory) {
            product.category = nextAminoCategory;
            changed++;
          }
          continue;
        }

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
        const proteinNames = new Set(SUBCATEGORIES.map(group => group.name));
        const nextCats = cats.filter(category => {
          const n = normalize(category);
          if (oldProteinCategories.has(category) || proteinNames.has(category)) return false;
          if (['aminoacidos','bcaa eaa','bcaa','eaa'].includes(n)) return false;
          return true;
        });

        nextCats.push('Aminoácidos', 'EAA');
        for (const group of SUBCATEGORIES) {
          if (!nextCats.includes(group.name)) nextCats.push(group.name);
        }
        if (PRODUCTS.some(product => product.category === 'Otros suplementos') && !nextCats.includes('Otros suplementos')) nextCats.push('Otros suplementos');
        nextCats.sort((a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' }));
        cats.splice(0, cats.length, ...new Set(nextCats));
      }

      if (typeof F !== 'undefined' && F?.cats instanceof Set) {
        for (const oldCategory of oldProteinCategories) F.cats.delete(oldCategory);
        for (const oldAmino of ['Aminoácidos','BCAA / EAA','BCAA/EAA','BCAA','EAA']) F.cats.delete(oldAmino);
      }

      if (typeof renderFilters === 'function') renderFilters();
      if (typeof render === 'function') render();

      document.documentElement.dataset.liftProteinSubcategories = 'ready';
      console.info(`[Lift] Catálogo reclasificado: ${changed}; duplicados eliminados: ${duplicatesRemoved}`);
      return true;
    } catch (error) {
      console.error('[Lift] No se pudieron aplicar las clasificaciones del catálogo', error);
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

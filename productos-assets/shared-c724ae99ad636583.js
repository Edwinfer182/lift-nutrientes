
(function(){
  function getEntityMatches(value){
    const q=norm(value).trim();
    if(!q) return {brands:[],categories:[]};

    const realBrands=[...new Set(PRODUCTS.map(p=>p.brand))]
      .filter(b=>b && !["Destacados Lift","Selección Lift","Varias marcas"].includes(b));
    const brands=realBrands.filter(b=>{
      const n=norm(b); return n.includes(q)||q.includes(n);
    }).sort((a,b)=>(norm(a)===q?-1:0)-(norm(b)===q?-1:0)||a.localeCompare(b)).slice(0,3);

    const cats=[...new Set(PRODUCTS.map(p=>p.category))].filter(Boolean);
    const categories=cats.filter(c=>{
      const n=norm(c);
      const aliases=[n,n+"s",n.replace(/a$/,"as"),n.replace(/o$/,"os")];
      return aliases.some(x=>x.includes(q)||q.includes(x));
    }).sort((a,b)=>(norm(a)===q?-1:0)-(norm(b)===q?-1:0)||a.localeCompare(b)).slice(0,3);

    return {brands,categories};
  }

  function logoUrlV2(brand){
    const id=window.LIFT_BRAND_LOGOS?.[brand];
    return id?`https://drive.google.com/thumbnail?id=${id}&sz=w300`:"";
  }

  function brandRowV2(brand){
    const count=PRODUCTS.filter(p=>p.brand===brand).length;
    const logo=logoUrlV2(brand);
    return `<div class="searchResult liftEntityResult">
      ${logo?`<img class="searchThumb" loading="lazy" decoding="async" src="${logo}" alt="Logo ${esc(brand)}">`:`<div class="searchEntityFallback">${esc(brand.charAt(0))}</div>`}
      <div class="searchInfo">
        <div class="liftEntityType">Laboratorio</div>
        <div class="searchName">${esc(brand)}</div>
        <div class="searchBrand">${count} producto${count===1?'':'s'}</div>
      </div>
      <div class="searchActions"><button class="searchView" onclick='event.stopPropagation();liftViewBrand(${JSON.stringify(brand)})'>Ver</button></div>
    </div>`;
  }

  function categoryRowV2(cat){
    const arr=PRODUCTS.filter(p=>p.category===cat);
    const representative=arr.find(p=>p.image)||arr[0];
    const img=representative?.image?String(representative.image).replace(/&sz=w\d+/i,'&sz=w240'):"";
    return `<div class="searchResult liftEntityResult">
      ${img?`<img class="searchThumb" loading="lazy" decoding="async" src="${img}" alt="${esc(cat)}">`:`<div class="searchEntityFallback">${esc(cat.charAt(0))}</div>`}
      <div class="searchInfo">
        <div class="liftEntityType">Categoría</div>
        <div class="searchName">${esc(cat)}</div>
        <div class="searchBrand">${arr.length} producto${arr.length===1?'':'s'}</div>
      </div>
      <div class="searchActions"><button class="searchView" onclick='event.stopPropagation();liftViewCategory(${JSON.stringify(cat)})'>Ver</button></div>
    </div>`;
  }

  function productActionsV2(p){
    const hasVariants = typeof getFlavorOptions==="function" && getFlavorOptions(p)?.length;
    if(hasVariants){
      return `<button class="searchView" onclick="event.stopPropagation();openLiftProductById(${p.id});closeQuickSearch()">Ver</button>`;
    }
    return `<button class="searchAdd" onclick="event.stopPropagation();add(${p.id})">Agregar</button>
            <button class="searchBuy" onclick="event.stopPropagation();buyNow(${p.id})">Comprar</button>`;
  }

  function productRowV2(p){
    const img=String(p.image).includes('drive.google.com/thumbnail')
      ? String(p.image).replace(/&sz=w\d+/i,'&sz=w240') : p.image;
    return `<div class="searchResult liftProductSearchRow" role="button" tabindex="0"
      onclick="if(!event.target.closest('button')){openLiftProductById(${p.id});closeQuickSearch()}"
      onkeydown="if(event.key==='Enter'&&!event.target.closest('button')){openLiftProductById(${p.id});closeQuickSearch()}">
      <img class="searchThumb" loading="lazy" decoding="async" fetchpriority="low" src="${img}" alt="${esc(p.name)}">
      <div class="searchInfo">
        <div class="searchName">${esc(p.name)}</div>
        <div class="searchBrand">${esc(p.brand)} · ${esc(p.category)}</div>
        <div class="searchPrice">${fmt(priceOf(p))}${savingOf(p)?`<span class="searchOldPrice">${fmt(compareAtOf(p))}</span>`:''}</div>
        ${savingOf(p)?`<div class="searchSaving">Ahorras ${fmt(savingOf(p))}</div>`:''}
        ${offerOf(p)?.gift?'<div class="searchSaving">🎁 Incluye regalo</div>':''}
        ${offerOf(p)?.flavors?.length?`<div class="searchFlavor">Sabores: ${offerOf(p).flavors.map(esc).join(' · ')}</div>`:''}
      </div>
      <div class="searchActions">${productActionsV2(p)}</div>
    </div>`;
  }

  window.renderQuickSearch=function(value){
    const box=document.getElementById('searchResults');
    const q=value.trim();
    if(!q){
      box.classList.remove('show'); box.innerHTML='';
      if(fullSearchActive){fullSearchActive=false;render()}
      return;
    }

    const all=searchProductsAll(value);
    const entities=getEntityMatches(value);
    const products=all.slice(0,7);

    let rows=products.map(productRowV2).join('');

    if(entities.categories.length || entities.brands.length){
      rows+=`<div class="liftEntitySectionTitle">Categorías y marcas</div>`;
      rows+=entities.categories.map(categoryRowV2).join('');
      rows+=entities.brands.map(brandRowV2).join('');
    }

    if(!rows) rows='<div class="searchEmpty">No encontré coincidencias.</div>';

    const allButton=all.length
      ? `<div class="searchAllWrap"><button class="searchAllBtn" onclick="showAllSearchResults()">Ver todos los productos (${all.length})</button></div>` : '';
    box.innerHTML=rows+allButton;
    box.classList.add('show');
  };
})();

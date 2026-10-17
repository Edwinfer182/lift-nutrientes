
(function(){
  const prevRender = window.renderQuickSearch;
  window.renderQuickSearch = function(value){
    const box=document.getElementById('searchResults');
    const q=value.trim();
    if(!q){
      box.classList.remove('show'); box.innerHTML='';
      if(fullSearchActive){fullSearchActive=false;render()}
      return;
    }

    const all=searchProductsAll(value);
    const products=all.slice(0,6);

    const nq=norm(value).trim();
    const cats=[...new Set(PRODUCTS.map(p=>p.category))].filter(Boolean);
    const categories=cats.filter(c=>{
      const n=norm(c);
      const aliases=[n,n+"s",n.replace(/a$/,"as"),n.replace(/o$/,"os")];
      return aliases.some(x=>x.includes(nq)||nq.includes(x));
    }).sort((a,b)=>(norm(a)===nq?-1:0)-(norm(b)===nq?-1:0)||a.localeCompare(b)).slice(0,3);

    const realBrands=[...new Set(PRODUCTS.map(p=>p.brand))]
      .filter(b=>b && !["Destacados Lift","Selección Lift","Varias marcas"].includes(b));
    const brands=realBrands.filter(b=>{
      const n=norm(b); return n.includes(nq)||nq.includes(n);
    }).sort((a,b)=>(norm(a)===nq?-1:0)-(norm(b)===nq?-1:0)||a.localeCompare(b)).slice(0,3);

    function logoUrlV3(brand){
      const id=window.LIFT_BRAND_LOGOS?.[brand];
      return id?`https://drive.google.com/thumbnail?id=${id}&sz=w300`:"";
    }

    function productActionsV3(p){
      const hasVariants = typeof getFlavorOptions==="function" && getFlavorOptions(p)?.length;
      if(hasVariants){
        return `<button class="searchView" onclick="event.stopPropagation();openLiftProductById(${p.id});closeQuickSearch()">Ver</button>`;
      }
      return `<button class="searchAdd" onclick="event.stopPropagation();add(${p.id})">Agregar</button>
              <button class="searchBuy" onclick="event.stopPropagation();buyNow(${p.id})">Comprar</button>`;
    }

    function productRowV3(p){
      const img=String(p.image).includes('drive.google.com/thumbnail')
        ? String(p.image).replace(/&sz=w\d+/i,'&sz=w240') : p.image;
      return `<div class="searchResult liftProductSearchRow" role="button" tabindex="0"
        onclick="if(!event.target.closest('button')){openLiftProductById(${p.id});closeQuickSearch()}"
        onkeydown="if(event.key==='Enter'&&!event.target.closest('button')){openLiftProductById(${p.id});closeQuickSearch()}">
        <img class="searchThumb" loading="lazy" decoding="async" src="${img}" alt="${esc(p.name)}">
        <div class="searchInfo">
          <div class="searchName">${esc(p.name)}</div>
          <div class="searchBrand">${esc(p.brand)} · <strong>${esc(p.category)}</strong></div>
          <div class="searchPrice">${fmt(priceOf(p))}${savingOf(p)?`<span class="searchOldPrice">${fmt(compareAtOf(p))}</span>`:''}</div>
          ${savingOf(p)?`<div class="searchSaving">Ahorras ${fmt(savingOf(p))}</div>`:''}
          ${offerOf(p)?.gift?'<div class="searchSaving">🎁 Incluye regalo</div>':''}
        </div>
        <div class="searchActions">${productActionsV3(p)}</div>
      </div>`;
    }

    function categoryRowV3(cat){
      const arr=PRODUCTS.filter(p=>p.category===cat);
      const representative=arr.find(p=>p.image)||arr[0];
      const img=representative?.image?String(representative.image).replace(/&sz=w\d+/i,'&sz=w240'):"";
      return `<div class="searchResult liftEntityResult">
        ${img?`<img class="searchThumb" loading="lazy" decoding="async" src="${img}" alt="${esc(cat)}">`:`<div class="searchEntityFallback">${esc(cat.charAt(0))}</div>`}
        <div class="searchInfo">
          <div class="liftEntityType">Categoría</div>
          <div class="searchName">${esc(cat)}</div>
          <div class="searchBrand">Ver los ${arr.length} productos de esta categoría</div>
        </div>
        <div class="searchActions"><button class="searchView" onclick='event.stopPropagation();liftViewCategory(${JSON.stringify(cat)})'>Ver</button></div>
      </div>`;
    }

    function brandRowV3(brand){
      const count=PRODUCTS.filter(p=>p.brand===brand).length;
      const logo=logoUrlV3(brand);
      return `<div class="searchResult liftEntityResult">
        ${logo?`<img class="searchThumb" loading="lazy" decoding="async" src="${logo}" alt="Logo ${esc(brand)}">`:`<div class="searchEntityFallback">${esc(brand.charAt(0))}</div>`}
        <div class="searchInfo">
          <div class="liftEntityType">Laboratorio</div>
          <div class="searchName">${esc(brand)}</div>
          <div class="searchBrand">Ver los ${count} productos de este laboratorio</div>
        </div>
        <div class="searchActions"><button class="searchView" onclick='event.stopPropagation();liftViewBrand(${JSON.stringify(brand)})'>Ver</button></div>
      </div>`;
    }

    let rows=products.map(productRowV3).join('');

    if(categories.length){
      rows+=`<div class="liftEntitySectionTitle">Categorías relacionadas</div>`;
      rows+=categories.map(categoryRowV3).join('');
    }
    if(brands.length){
      rows+=`<div class="liftEntitySectionTitle">Laboratorios relacionados</div>`;
      rows+=brands.map(brandRowV3).join('');
    }

    if(!rows) rows='<div class="searchEmpty">No encontré coincidencias.</div>';

    const allButton=all.length
      ? `<div class="searchAllWrap"><button class="searchAllBtn" onclick="showAllSearchResults()">Ver todos los productos (${all.length})</button></div>`:'';

    box.innerHTML=rows+allButton;
    box.classList.add('show');
  };
})();

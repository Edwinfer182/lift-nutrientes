
window.LIFT_DATA_SOURCE='supabase';
const PRODUCTS=[];
// ===== LIFT · CUPONES Y PRECIOS ENTRENADOR =====
const LIFT_COUPON_SUPABASE_URL='https://vdxkknftyssjyfbdieqa.supabase.co';
const LIFT_COUPON_SUPABASE_KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
// Precio entrenador: únicamente desde los datos cargados desde Supabase.
// No hay mapas ni porcentajes de respaldo incrustados en este HTML.
function trainerPriceOf(p){
  const publicPrice=Number(priceOf(p)||0);
  const saved=Number(p?.trainerPrice||0);
  return saved>0?Math.max(0,Math.min(publicPrice,saved)):publicPrice;
}
function trainerCouponActive(){
  return !!(appliedCoupon&&appliedCoupon.discountType==='trainer_price');
}
let LIFT_ADMIN_PRICE_MODE='public';
function liftSetAdminPriceMode(mode,btn){
  LIFT_ADMIN_PRICE_MODE=mode==='trainer'?'trainer':'public';
  document.querySelectorAll('#liftAdminPriceMode [data-price-mode]').forEach(b=>b.classList.toggle('on',b.dataset.priceMode===LIFT_ADMIN_PRICE_MODE));
  if(typeof renderCheckoutSummary==='function')renderCheckoutSummary();
}
function adminTrainerMode(){
  return document.body.classList.contains('liftAdminUnlocked') && LIFT_ADMIN_PRICE_MODE==='trainer';
}
function checkoutUnitPrice(p){
  return (adminTrainerMode()||trainerCouponActive())?trainerPriceOf(p):priceOf(p);
}
function checkoutPublicSubtotal(its=checkoutItemsList()){
  return its.reduce((s,x)=>s+priceOf(x.p)*x.q,0);
}
function checkoutEffectiveSubtotal(its=checkoutItemsList()){
  return its.reduce((s,x)=>s+checkoutUnitPrice(x.p)*x.q,0);
}
function checkoutCouponDiscount(its=checkoutItemsList()){
  const publicSub=checkoutPublicSubtotal(its);
  if(trainerCouponActive()) return Math.max(0,publicSub-checkoutEffectiveSubtotal(its));
  return Math.min(publicSub,Number(appliedCoupon?.discount||0));
}
function checkoutCouponPayload(){
  const its=checkoutItemsList();
  return {
    p_code:String(document.getElementById('coCoupon')?.value||'').trim(),
    p_phone:String(document.getElementById('coPhone')?.value||'').trim(),
    p_subtotal:checkoutPublicSubtotal(its),
    p_categories:[...new Set(its.map(x=>x.p.category).filter(Boolean))],
    p_brands:[...new Set(its.map(x=>x.p.brand).filter(Boolean))]
  };
}
async function liftCouponRpc(name,args){
  const r=await fetch(`${LIFT_COUPON_SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'apikey':LIFT_COUPON_SUPABASE_KEY,
      'Authorization':`Bearer ${LIFT_COUPON_SUPABASE_KEY}`
    },
    body:JSON.stringify(args)
  });
  const text=await r.text();
  let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok)throw new Error(data?.message||data?.error||text||`HTTP ${r.status}`);
  return data;
}
function couponReasonText(reason,data={}){
  const map={
    invalid_code:'Código no válido.',
    inactive:'Este cupón está inactivo.',
    not_started:'Este cupón todavía no está vigente.',
    expired:'Este cupón ya venció.',
    minimum_not_met:`La compra mínima es ${fmt(Number(data.minimum||0))}.`,
    not_assigned_to_phone:'Este cupón está asociado a otro celular.',
    category_not_eligible:'El cupón no aplica a esta categoría.',
    brand_not_eligible:'El cupón no aplica a esta marca.',
    usage_limit_reached:'Este cupón ya alcanzó su límite de usos.',
    phone_usage_limit_reached:'Este celular ya utilizó el máximo permitido para este cupón.',
    invalid_discount_type:'El tipo de beneficio no es válido.'
  };
  return map[reason]||'No fue posible aplicar este cupón.';
}
// ===== FIN CUPONES ENTRENADOR =====
// Protección de imagen Nutricost Myo D-Chiro
PRODUCTS.forEach(p=>{
  const n=String(p.name||'').toLowerCase();
  if(n.includes('myo')&&n.includes('chiro')&&n.includes('inositol')){
    p.image='https://drive.google.com/thumbnail?id=148syEMJDgQmISm43BVAHjOThj67Vtwb5&sz=w1200';
  }
});

const fmt=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n||0);
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const norm=s=>String(s||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function attrs(p){
  const n=norm(p.name);
  let weight=null, services=null;
  let m=n.match(/(\d+(?:[.,]\d+)?)\s*(?:lb|lbs|libra|libras)\b/); if(m) weight={kind:'lb',value:parseFloat(m[1].replace(',','.')),label:`${m[1]} lb`};
  if(!weight){m=n.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilos)\b/);if(m)weight={kind:'kg',value:parseFloat(m[1].replace(',','.')),label:`${m[1]} kg`};}
  if(!weight){m=n.match(/(\d{2,4})\s*(?:gr|g|gramos?)\b/);if(m)weight={kind:'g',value:parseInt(m[1]),label:`${m[1]} g`};}
  m=n.match(/(\d{1,4})\s*(?:serv|srv|servicios?|porciones?)\b/);if(m)services=parseInt(m[1]);
  return {weight,services};
}
PRODUCTS.forEach(p=>Object.assign(p,{_attr:attrs(p)}));

/*
  OFERTAS SEMANALES
  ---------------------------------------------------------
  Cada semana reemplaza SOLO este objeto con las promociones nuevas.
  Si un producto sale de WEEKLY_OFFERS, vuelve automáticamente a p.price.
  IMPORTANTE: costos de proveedor y márgenes NO se guardan aquí porque este
  archivo se ejecuta en el navegador y el cliente podría inspeccionarlos.
*/
// OFERTAS: estado de ejecución únicamente.
// La fuente persistente y única es Supabase: lift_catalog_config.clave = "weekly_offers".
const WEEKLY_OFFERS={}

function offerOf(p){if(!p)return null;if(p._variantGroupId&&!p._isVariantGroupCard&&!p._variantProductId&&p._cartFlavor)return null;const o=WEEKLY_OFFERS[p._variantProductId||p.id]||null;if(!o)return null;if(o.promoUntil&&Date.now()>new Date(o.promoUntil).getTime())return null;return o}
function hasOffer(p){return !!offerOf(p)}
function priceOf(p){const o=offerOf(p);return o?o.price:p.price}
function compareAtOf(p){return p.price}
function savingOf(p){return Math.max(0,compareAtOf(p)-priceOf(p))}
function offerBadges(p){const o=offerOf(p);if(!o)return '';return `<span class="saleBadge">OFERTA</span>`}
function offerUntilText(p){const o=offerOf(p);if(!o?.promoUntil)return '';const d=new Date(o.promoUntil);if(isNaN(d))return '';return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}
function offerUntilHTML(p,cls='offerUntil'){const t=offerUntilText(p);return t?`<div class="${cls}">Oferta hasta ${esc(t)}</div>`:''}
function offerDetails(p){const o=offerOf(p);if(!o)return '';const save=savingOf(p);const flavors=o.flavors?.length?`<div class="flavorNote"><b>Sabores en promoción:</b> ${o.flavors.map(esc).join(' · ')}</div>`:'';return `${o.gift?'<div class="giftBadge">🎁 Incluye regalo</div>':''}${save?`<div class="saving">Ahorras ${fmt(save)}</div>`:''}${offerUntilHTML(p)}${flavors}`}
function priceHTML(p){const current=priceOf(p),save=savingOf(p);return `<div class="offerPrices">${save?`<span class="oldPrice">${fmt(compareAtOf(p))}</span>`:''}<span class="price${save?' promoPrice':''}">${fmt(current)}</span></div>${offerDetails(p)}`}

let state={q:'',cat:'Destacados',brand:'Todas',filterView:'brands',offerOnly:false,sort:'recommended'};
let LIFT_FEATURED_CONFIG={enabled:true,label:'Destacados',products_per_brand:3,include_active_offers:true,randomize_on_load:true,avoid_offer_duplicates:true};
let LIFT_FEATURED_IDS=new Set();
let cart=JSON.parse(localStorage.getItem('liftCartV2')||localStorage.getItem('liftCartV1')||'{}');
let cartMeta=JSON.parse(localStorage.getItem('liftCartMetaV1')||'{}');

// Migración: si una versión anterior guardó un sabor usando solo el ID,
// lo convertimos a una línea independiente "producto::sabor".
for(const oldKey of Object.keys(cartMeta)){
  const meta=cartMeta[oldKey];
  if(meta&&meta.flavor&&cart[oldKey] && !String(oldKey).includes('::')){
    const variantKey=`${oldKey}::${meta.flavor}`;
    if(!cart[variantKey]){
      cart[variantKey]=cart[oldKey];
      cartMeta[variantKey]=meta;
    }
    delete cart[oldKey];
    delete cartMeta[oldKey];
  }
}
window.LIFT_CART_META=cartMeta;
window.LIFT_SINGLE_META=null;
let LIFT_CATEGORY_CONFIG={};

// LIFT · ORDEN DE FILTROS CONTROLADO POR SUPABASE
// categories_v1 y laboratories_v1 guardan un campo `order` por elemento.
// El HTML solo lo obedece; si un elemento nuevo aún no tiene order, cae al final.
function liftSupabaseOrder(name, config){
  const direct=config?.[name];
  const n=Number(direct?.order);
  if(Number.isFinite(n)) return n;
  const nk=typeof norm==='function'?norm(name):String(name||'').toLowerCase();
  for(const [k,v] of Object.entries(config||{})){
    const kk=typeof norm==='function'?norm(k):String(k||'').toLowerCase();
    if(kk===nk){
      const x=Number(v?.order);
      if(Number.isFinite(x)) return x;
    }
  }
  return Number.MAX_SAFE_INTEGER;
}
function liftSortBySupabaseOrder(items, config, getName=x=>x){
  return items.sort((a,b)=>{
    const an=getName(a), bn=getName(b);
    const ao=liftSupabaseOrder(an,config), bo=liftSupabaseOrder(bn,config);
    return ao-bo || String(an).localeCompare(String(bn),'es',{sensitivity:'base'});
  });
}

/* ============================================================
   LIFT · FILTROS RECONSTRUIDOS
   Única fuente: los valores category y brand de PRODUCTS.
   PRODUCTS es actualizado por Excel y luego persistido en Supabase.
   No se agregan categorías ni marcas antiguas desde configuraciones.
   ============================================================ */
let cats=['Todos'];
let brands=['Todas'];

function liftUniqueFieldValues(field){
  const map=new Map();
  for(const p of PRODUCTS){
    const raw=String(p?.[field]||'').trim();
    if(!raw) continue;
    const key=norm(raw);
    if(!key || key==='ofertas') continue;
    if(!map.has(key)) map.set(key,raw);
  }
  const values=[...map.values()];
  const cfg=field==='category' ? LIFT_CATEGORY_CONFIG : (window.LIFT_LABORATORIES_SUPABASE||{});
  return liftSortBySupabaseOrder(values,cfg,x=>x);
}
function rebuildLiftCategories(){
  cats.splice(0,cats.length,'Destacados','Todos',...liftUniqueFieldValues('category'));
}
function rebuildLiftBrands(){
  brands.splice(0,brands.length,'Todas',...liftUniqueFieldValues('brand'));
}
function rebuildLiftExcelFilters(){
  rebuildLiftCategories();
  rebuildLiftBrands();
  if(state?.cat && state.cat!=='Todos' && !cats.some(c=>norm(c)===norm(state.cat))) state.cat='Todos';
  if(state?.brand && state.brand!=='Todas' && !brands.some(b=>norm(b)===norm(state.brand))) state.brand='Todas';
}
rebuildLiftCategories();
rebuildLiftBrands();

const CATEGORY_PSEUDO_BRANDS=new Set(['destacados lift','selección lift','seleccion lift','destacados','selección','seleccion']);
function categoryKey(p){
  let k=norm(p?.name||'').trim();
  // Estos dos nombres son la misma referencia de glutamina; en categoría debe verse una sola.
  if(k==='glutamina platinum 300gr -60 serv') k='glutamina platinum 300gr';
  return k;
}
function liftShuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function rebuildLiftFeatured(){
  const cfg=LIFT_FEATURED_CONFIG||{};
  const per=Math.max(1,Number(cfg.products_per_brand||3));
  const visible=liftVisibleProducts();
  const selected=new Map();
  if(cfg.include_active_offers!==false){
    for(const p of visible){if(hasOffer(p))selected.set(String(p.id),p)}
  }
  const byBrand=new Map();
  for(const p of visible){
    const brand=String(p.brand||'').trim();
    if(!brand)continue;
    if(!byBrand.has(brand))byBrand.set(brand,[]);
    byBrand.get(brand).push(p);
  }
  for(const list of byBrand.values()){
    let pool=list.filter(p=>!(cfg.avoid_offer_duplicates!==false && selected.has(String(p.id))));
    pool=liftShuffle(pool);
    for(const p of pool.slice(0,per))selected.set(String(p.id),p);
  }
  LIFT_FEATURED_IDS=new Set([...selected.keys()]);
  return [...selected.values()];
}
function liftFeaturedProducts(){
  if(!LIFT_FEATURED_IDS.size)rebuildLiftFeatured();
  return liftVisibleProducts().filter(p=>LIFT_FEATURED_IDS.has(String(p.id)));
}
function categoryProducts(cat){
  const wanted=norm(cat);
  if(wanted==='destacados') return liftFeaturedProducts();

  // "Proteína" funciona como categoría madre.
  // Incluye todas las subcategorías de proteína sin borrar la clasificación actual.
  const proteinChildren = new Set([
    'proteina whey',
    'proteina aislada / limpia',
    'proteina hidrolizada',
    'proteina vegana',
    'proteina de carne',
    'proteina de otras fuentes'
  ]);

  const proteinExclusions = new Set([
    'maca root 750mg/180 cap',
    'maca root 750mg 180 cap',
    'nac 600 mg.120 tab',
    'nac 600 mg 120 tab',
    'ultimate pre workout 30 serv'
  ]);

  const raw = wanted==='proteina'
    ? PRODUCTS.filter(p=>
        proteinChildren.has(norm(p.category||'')) &&
        !proteinExclusions.has(norm(p.name||''))
      )
    : PRODUCTS.filter(p=>norm(p.category||'')===wanted);
  const groups=new Map();
  for(const p of raw){
    const k=categoryKey(p);
    if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push(p);
  }
  const out=[];
  for(const list of groups.values()){
    // Prioriza la ficha perteneciente a una marca real.
    let chosen=list.find(p=>!CATEGORY_PSEUDO_BRANDS.has(norm(p.brand||'')))||list[0];

    // SOLO para la vista de categorías: si otra copia ya tiene URL,
    // reutiliza esa misma imagen sin tocar la ficha de la marca.
    const withUrl=list.find(p=>/^https?:\/\//i.test(String(p.image||'')));
    if(withUrl && !/^https?:\/\//i.test(String(chosen.image||''))){
      chosen={...chosen,image:withUrl.image};
    }
    out.push(chosen);
  }
  return out;
}
function liftProductVisible(p){
  const isPrivate = !!(p && (
    p.adminOnly === true ||
    p.__private === true ||
    p.visibility === 'admin' ||
    p.visibility === 'admin_only'
  ));
  return !isPrivate || document.body.classList.contains('liftAdminUnlocked');
}
function liftVisibleProducts(){
  return PRODUCTS.filter(liftProductVisible);
}

/* FASE 3 · una tarjeta pública por grupo de variaciones */
window.LIFT_PUBLIC_VARIANT_GROUPS=window.LIFT_PUBLIC_VARIANT_GROUPS||[];

function liftVariantGroups(){
  return Array.isArray(window.LIFT_PUBLIC_VARIANT_GROUPS)?window.LIFT_PUBLIC_VARIANT_GROUPS:[];
}
function liftVariantMemberMap(){
  const map=new Map();
  for(const g of liftVariantGroups()){
    for(const v of (Array.isArray(g.lift_producto_variantes)?g.lift_producto_variantes:[])){
      if(v?.activo!==false && v?.producto_id!=null) map.set(String(v.producto_id),g);
    }
  }
  return map;
}
function liftGroupCardProduct(g,fallback){
  const vv=(Array.isArray(g?.lift_producto_variantes)?g.lift_producto_variantes:[])
    .filter(v=>v?.activo!==false)
    .sort((a,b)=>Number(a.orden||0)-Number(b.orden||0)||Number(a.id||0)-Number(b.id||0));
  const base=fallback||vv.map(v=>PRODUCTS.find(p=>String(p.id)===String(v.producto_id))).find(Boolean);
  if(!base)return null;
  const gp=Number(g.precio||0);
  return {...base,
    id:base.id,
    name:String(g.nombre||base.name||'').trim(),
    brand:String(g.marca||base.brand||'').trim(),
    category:String(base.category||'').trim(),
    presentation:String(g.presentacion||base.presentation||'').trim(),
    price:gp>0?gp:base.price,
    image:String(g.imagen||base.image||'').trim(),
    _variantGroupId:Number(g.id),
    _variantCount:vv.length,
    _variantFlavors:vv.map(v=>String(v.sabor||'').trim()).filter(Boolean),
    _variantProductIds:vv.map(v=>Number(v.producto_id)).filter(Number.isFinite),
    _isVariantGroupCard:true
  };
}
function liftGroupOffers(g){
  return liftGroupVariants(g).map(v=>({v,p:liftVariantProduct(v),o:liftVariantOffer(v)})).filter(x=>x.o);
}
function liftGroupCardOffer(p){
  if(!p?._variantGroupId)return null;
  const g=liftGroupById(p._variantGroupId); if(!g)return null;
  const all=liftGroupVariants(g).map(v=>({v,p:liftVariantProduct(v)}));
  const offered=all.map(x=>({...x,o:liftVariantOffer(x.v)})).filter(x=>x.o);
  if(!offered.length)return null;
  // Las ofertas vigentes de cada sabor prevalecen sobre el precio base del grupo.
  const priced=all.map(x=>({ ...x, sale:liftVariantSalePrice(g,x.v,x.p), normal:liftVariantNormalPrice(g,x.v,x.p), offer:liftVariantOffer(x.v) })).filter(x=>Number.isFinite(x.sale));
  const lowest=Math.min(...priced.map(x=>x.sale));
  const lowestRow=priced.find(x=>x.sale===lowest)||priced[0];
  const promoRows=priced.filter(x=>x.offer&&x.sale<x.normal);
  const promoLowest=promoRows.length?Math.min(...promoRows.map(x=>x.sale)):null;
  const promoRow=promoRows.find(x=>x.sale===promoLowest)||null;
  return {count:offered.length,lowest,normalLowest:promoRow?promoRow.normal:(lowestRow?.normal||lowest),promoLowest};
}
function liftCatalogGrouped(arr){
  const source=Array.isArray(arr)?arr:[];
  if(!liftVariantGroups().length)return source;
  const members=liftVariantMemberMap(),seen=new Set(),out=[];
  for(const p of source){
    const g=members.get(String(p.id));
    if(!g){out.push(p);continue}
    if(seen.has(String(g.id)))continue;
    seen.add(String(g.id));
    const parent=liftGroupCardProduct(g,p);
    if(parent)out.push(parent);
  }
  return out;
}

function liftGroupByProductId(productId){
  const id=String(productId);
  return liftVariantGroups().find(g=>liftGroupVariants(g).some(v=>String(v.producto_id)===id))||null;
}
function liftGroupById(groupId){return liftVariantGroups().find(g=>String(g.id)===String(groupId))||null}
function liftGroupVariants(g){
  return (Array.isArray(g?.lift_producto_variantes)?g.lift_producto_variantes:[])
    .filter(v=>v?.activo!==false)
    .sort((a,b)=>Number(a.orden||0)-Number(b.orden||0)||Number(a.id||0)-Number(b.id||0));
}
function liftVariantProduct(v){return PRODUCTS.find(p=>String(p.id)===String(v?.producto_id))||null}
function liftVariantOffer(v){
  const p=liftVariantProduct(v);
  return p&&typeof offerOf==='function'?offerOf(p):null;
}
function liftVariantNormalPrice(g,v,p){
  // La ficha principal del grupo determina el precio de todos los sabores.
  const groupPrice=Number(g?.precio||0);
  if(groupPrice>0)return groupPrice;
  const main=liftGroupVariants(g).map(x=>liftVariantProduct(x)).find(Boolean);
  return Number(main?.price||p?.price||0);
}
function liftVariantSalePrice(g,v,p){
  const normal=liftVariantNormalPrice(g,v,p);
  const offer=liftVariantOffer(v);
  const promotional=Number(offer?.price||0);
  return offer&&promotional>0&&promotional<normal?promotional:normal;
}
window.LIFT_SELECTED_GROUP_VARIANT=window.LIFT_SELECTED_GROUP_VARIANT||{};

window.liftSelectGroupVariant=function(groupId,variantId){
  const g=liftGroupById(groupId), v=liftGroupVariants(g).find(x=>String(x.id)===String(variantId));
  if(!g||!v)return;
  window.LIFT_SELECTED_GROUP_VARIANT[String(groupId)]=String(v.id);
  const p=liftVariantProduct(v);
  const img=String(v.imagen||p?.image||g.imagen||'').trim();
  const normalPrice=liftVariantNormalPrice(g,v,p);
  const salePrice=liftVariantSalePrice(g,v,p);
  const vo=liftVariantOffer(v)&&salePrice<normalPrice;
  const main=document.getElementById('liftMonoMainImg'); if(main&&img)main.src=img;
  const priceArea=document.querySelector('.liftMonoPriceArea');
  if(priceArea&&salePrice>0)priceArea.innerHTML=vo
    ? `<div class="offerPrices"><span class="oldPrice">${fmt(normalPrice)}</span><span class="liftMonoPrice">${fmt(salePrice)}</span></div><div class="saving">Oferta en ${esc(v.sabor||'esta variante')}</div>`
    : `<div class="liftMonoPrice">${fmt(normalPrice)}</div>`;
  document.querySelectorAll('#liftGroupVariantPicker .liftVariantChip').forEach(b=>b.classList.toggle('active',String(b.dataset.variantId)===String(v.id)));
  const sel=document.getElementById('liftGroupVariantSelected'); if(sel)sel.textContent='Sabor: '+String(v.sabor||'Variación');
  const addBtn=document.getElementById('liftMonoAdd'); if(addBtn)addBtn.innerHTML=`<span class="liftActionIcon">＋</span><span>Agregar · ${esc(v.sabor||'Variación')}</span>`;
  const share=document.querySelector('.detailShareImageBtn'); if(share&&p)share.setAttribute('onclick',`event.stopPropagation();shareLiftProductImage(${Number(p.id)})`);
};

window.liftAddSelectedGroupVariant=function(groupId,quantity=1){
  const g=liftGroupById(groupId), vv=liftGroupVariants(g); if(!g||!vv.length)return false;
  const v=vv.find(x=>String(x.id)===String(window.LIFT_SELECTED_GROUP_VARIANT[String(groupId)]))||vv[0];
  const p=liftVariantProduct(v); if(!p)return false;
  addVariant(
    p.id,
    String(v.sabor||'Variación'),
    String(v.imagen||p.image||g.imagen||''),
    {groupId:Number(g.id),variantId:Number(v.id),variantPrice:liftVariantSalePrice(g,v,p),variantNormalPrice:liftVariantNormalPrice(g,v,p),variantOffer:!!liftVariantOffer(v)&&liftVariantSalePrice(g,v,p)<liftVariantNormalPrice(g,v,p)},
    quantity
  );
  return true;
};

function liftInjectGroupVariantPicker(productId){
  const g=liftGroupByProductId(productId), vv=liftGroupVariants(g); if(!g||!vv.length)return false;
  const info=document.querySelector('.liftMonoInfo'); if(!info)return false;
  document.getElementById('liftGroupVariantPicker')?.remove();
  const current=vv.find(v=>String(v.id)===String(window.LIFT_SELECTED_GROUP_VARIANT[String(g.id)]))||vv[0];
  window.LIFT_SELECTED_GROUP_VARIANT[String(g.id)]=String(current.id);
  const box=document.createElement('div');
  box.id='liftGroupVariantPicker'; box.className='liftVariantPicker';
  box.innerHTML=`<div class="liftVariantPickerHead"><b id="liftGroupVariantSelected">Sabor: ${esc(current.sabor||'Variación')}</b></div>
  <div class="liftVariantChips">${vv.map(v=>{const vp=liftVariantProduct(v),vi=String(v.imagen||vp?.image||g.imagen||'').trim(),normal=liftVariantNormalPrice(g,v,vp),sale=liftVariantSalePrice(g,v,vp),vo=!!liftVariantOffer(v)&&sale<normal;return `<button type="button" class="liftVariantChip${String(v.id)===String(current.id)?' active':''}" data-variant-id="${esc(v.id)}" onclick="liftSelectGroupVariant(${Number(g.id)},${Number(v.id)})">${vo?'<span class="liftVariantOfferBadge">OFERTA</span>':''}<span class="liftVariantThumb">${vi?`<img src="${esc(vi)}" alt="${esc(v.sabor||'Variación')}" loading="lazy">`:''}</span><span class="liftVariantFlavor">${esc(v.sabor||'Variación')}</span>${vo?`<span class="liftVariantPrices"><s>${fmt(normal)}</s><b>${fmt(sale)}</b></span>`:''}</button>`}).join('')}</div>
  `;
  const priceArea=info.querySelector('.liftMonoPriceArea');
  priceArea?.insertAdjacentElement('afterend',box);
  const title=info.querySelector('.liftMonoTitle'); if(title)title.textContent=String(g.nombre||title.textContent||'');
  const brand=info.querySelector('.liftMonoBrand'); if(brand)brand.textContent=String(g.marca||brand.textContent||'');
  const cat=info.querySelector('.liftMonoCategory'); if(cat){ const source=liftVariantProduct(current)||PRODUCTS.find(p=>String(p.id)===String(productId)); cat.textContent=String(source?.category||cat.textContent||'').trim(); }
  const meta=info.querySelector('.liftMonoQuickMeta');
  if(meta)meta.innerHTML='';
  liftSelectGroupVariant(g.id,current.id);
  return true;
}

const _liftBaseOfferOf=offerOf, _liftBaseHasOffer=hasOffer, _liftBasePriceOf=priceOf, _liftBaseCompareAtOf=compareAtOf, _liftBaseSavingOf=savingOf, _liftBaseOfferBadges=offerBadges, _liftBaseOfferDetails=offerDetails, _liftBasePriceHTML=priceHTML;
offerOf=function(p){return _liftBaseOfferOf(p)};
hasOffer=function(p){return p?._isVariantGroupCard?!!liftGroupCardOffer(p):_liftBaseHasOffer(p)};
priceOf=function(p){const go=p?._isVariantGroupCard?liftGroupCardOffer(p):null;return go?go.lowest:_liftBasePriceOf(p)};
compareAtOf=function(p){return p?._isVariantGroupCard?Number(p.price||0):_liftBaseCompareAtOf(p)};
savingOf=function(p){return Math.max(0,compareAtOf(p)-priceOf(p))};
offerBadges=function(p){const go=p?._isVariantGroupCard?liftGroupCardOffer(p):null;return go?`<span class="saleBadge">${go.count} ${go.count===1?'SABOR':'SABORES'} EN OFERTA</span>`:_liftBaseOfferBadges(p)};
offerDetails=function(p){const go=p?._isVariantGroupCard?liftGroupCardOffer(p):null;return go?`<div class="flavorNote"><b>${go.count} ${go.count===1?'sabor':'sabores'} en promoción</b></div>`:_liftBaseOfferDetails(p)};
priceHTML=function(p){const go=p?._isVariantGroupCard?liftGroupCardOffer(p):null;if(!go)return _liftBasePriceHTML(p);const old=Number(go.normalLowest||0),sale=Number(go.promoLowest||go.lowest||0);return `<div class="offerPrices">${old>sale?`<span class="oldPrice">${fmt(old)}</span>`:''}<span class="price promoPrice">Desde ${fmt(sale)}</span></div>${offerDetails(p)}`};

function filtered(){
  const VISIBLE_PRODUCTS=liftVisibleProducts();
  let base;
  if(state.cat!=='Todos' && state.brand==='Todas'){
    base=categoryProducts(state.cat);
  }else{
    if(state.cat!=='Todos' && norm(state.cat)==='proteina'){
      const proteinChildren = new Set([
        'proteina whey',
        'proteina aislada / limpia',
        'proteina hidrolizada',
        'proteina vegana',
        'proteina de carne',
        'proteina de otras fuentes'
      ]);
      const proteinExclusions = new Set([
        'maca root 750mg/180 cap',
        'maca root 750mg 180 cap',
        'nac 600 mg.120 tab',
        'nac 600 mg 120 tab',
        'ultimate pre workout 30 serv'
      ]);
      base=VISIBLE_PRODUCTS.filter(p=>
        proteinChildren.has(norm(p.category||'')) &&
        !proteinExclusions.has(norm(p.name||'')) &&
        (state.brand==='Todas'||p.brand===state.brand)
      );
    }else{
      base=VISIBLE_PRODUCTS.filter(p=>(state.cat==='Todos'||norm(p.category||'')===norm(state.cat))&&(state.brand==='Todas'||p.brand===state.brand));
    }
  }
  let out=base.filter(p=>!state.offerOnly||hasOffer(p));
  out=liftCatalogGrouped(out);
  if(state.sort==='nameAsc') out=[...out].sort((a,b)=>String(a?.name||'').localeCompare(String(b?.name||''),'es',{sensitivity:'base',numeric:true}));
  else if(state.sort==='nameDesc') out=[...out].sort((a,b)=>String(b?.name||'').localeCompare(String(a?.name||''),'es',{sensitivity:'base',numeric:true}));
  else if(state.sort==='priceAsc') out=[...out].sort((a,b)=>priceOf(a)-priceOf(b));
  else if(state.sort==='priceDesc') out=[...out].sort((a,b)=>priceOf(b)-priceOf(a));
  else if(state.sort==='offers') out=[...out].sort((a,b)=>(hasOffer(b)?1:0)-(hasOffer(a)?1:0)||Number(savingOf(b)||0)-Number(savingOf(a)||0));
  return out;
}
function updateOffersButton(){const btn=document.getElementById('offersButton'),count=document.getElementById('offersCount');if(count)count.textContent=liftVisibleProducts().filter(hasOffer).length;if(btn)btn.classList.toggle('active',state.offerOnly)}
let mobileRenderToken=0;
function renderProductListProgressive(arr,emptyText='No encontré productos.'){
  const grid=document.getElementById('grid');
  const isMobile=window.matchMedia('(max-width: 640px)').matches;
  if(!isMobile){
    grid.innerHTML=productCards(arr,emptyText);
    return;
  }
  const token=++mobileRenderToken;
  const batch=32;
  let shown=0;
  grid.innerHTML='';
  if(!arr.length){
    grid.innerHTML=`<div class="empty">${emptyText}</div>`;
    return;
  }
  const appendNext=()=>{
    if(token!==mobileRenderToken)return;
    const next=arr.slice(shown,shown+batch);
    grid.insertAdjacentHTML('beforeend',productCards(next,emptyText));
    shown+=next.length;
    const oldSentinel=document.getElementById('mobileLoadMoreSentinel');
    oldSentinel?.remove();
    if(shown<arr.length){
      const sentinel=document.createElement('div');
      sentinel.id='mobileLoadMoreSentinel';
      sentinel.className='mobileLoadMoreSentinel';
      sentinel.textContent=`Mostrando ${shown} de ${arr.length}`;
      grid.appendChild(sentinel);
      const io=new IntersectionObserver(entries=>{
        if(entries.some(e=>e.isIntersecting)){
          io.disconnect();
          requestAnimationFrame(appendNext);
        }
      },{rootMargin:'500px 0px'});
      io.observe(sentinel);
    }
  };
  appendNext();
}
// LIFT · ENLACES DIRECTOS DEL CATÁLOGO
// La URL puede abrir categoría, laboratorio, ofertas o un producto sin duplicar páginas.
function liftCatalogBaseUrl(){
  const u=new URL(location.href);u.search='';u.hash='';return u;
}
function liftBuildFilterUrl(type,value){
  const u=liftCatalogBaseUrl();
  if(type==='ofertas')u.searchParams.set('ofertas','1');
  else if(type==='producto')u.searchParams.set('producto',String(value));
  else if(type==='marca')u.searchParams.set('marca',String(value));
  else u.searchParams.set('categoria',String(value));
  return u.toString();
}
async function liftCopyFilterLink(type,value){
  const url=liftBuildFilterUrl(type,value);
  try{await navigator.clipboard.writeText(url);alert('Enlace copiado.');}
  catch(e){prompt('Copia este enlace:',url)}
}
window.liftCopyFilterLink=liftCopyFilterLink;
function liftApplyUrlFilter(){
  const sp=new URLSearchParams(location.search);
  const productId=sp.get('producto');
  const offers=sp.get('ofertas');
  const requestedBrand=sp.get('marca');
  const requestedCat=sp.get('categoria');
  state.offerOnly=false;state.brand='Todas';state.cat='Destacados';
  if(offers==='1'||norm(offers)==='true'){
    state.offerOnly=true;state.cat='Todos';state.brand='Todas';
  }else if(requestedBrand){
    const real=brands.find(b=>norm(b)===norm(requestedBrand));
    if(real){state.brand=real;state.cat='Todos';state.filterView='brands'}
  }else if(requestedCat){
    const real=cats.find(c=>norm(c)===norm(requestedCat));
    if(real){state.cat=real;state.brand='Todas';state.filterView='categories'}
  }
  return productId;
}
function liftOpenUrlProduct(productId){
  if(!productId)return;
  const p=PRODUCTS.find(x=>String(x.id)===String(productId));
  if(p)setTimeout(()=>openLiftProductById(p.id),80);
}
function render(){
  const arr=filtered();
  document.getElementById('status').textContent=state.offerOnly?`🔥 ${arr.length} ofertas disponibles`:(norm(state.cat)==='destacados'?`⭐ ${arr.length} productos destacados`:`${arr.length} productos encontrados`);
  renderProductListProgressive(arr,state.offerOnly?'No hay ofertas activas en este momento.':'No encontré productos con esos filtros.');
  renderFilters();
  updateOffersButton()
}
function renderChips(){}
function filterHTML(){
  rebuildLiftExcelFilters();
  const VISIBLE_PRODUCTS=liftVisibleProducts();
  const GROUPED_VISIBLE=liftCatalogGrouped(VISIBLE_PRODUCTS);
  const cc=Object.fromEntries(cats.map(c=>[c,c==='Todos'?GROUPED_VISIBLE.length:GROUPED_VISIBLE.filter(p=>norm(p.category)===norm(c)).length]));
  const bc=Object.fromEntries(brands.map(b=>[b,b==='Todas'?GROUPED_VISIBLE.length:GROUPED_VISIBLE.filter(p=>norm(p.brand)===norm(b)).length]));
  const isBrands=state.filterView==='brands';
  return `<div class="filterTabs"><button class="filterTab ${isBrands?'on':''}" onclick="setFilterView('brands')">Laboratorios</button><button class="filterTab ${!isBrands?'on':''}" onclick="setFilterView('categories')">Categorías</button></div>
<section class="filterPanel" ${isBrands?'':'hidden'}>
  <div class="labVisualWrap">
    <div class="labVisualSearchWrap"><input id="labVisualSearch" class="labVisualSearch" type="search" autocomplete="off" placeholder="Buscar laboratorio..."></div>
    <div id="labVisualGrid" class="labVisualGrid">
      ${brands.filter(b=>b!=='Todas').map(b=>`<div class="liftFilterRow"><button class="filterItem ${state.brand===b?'on':''}" onclick='setBrand(${JSON.stringify(b)})'><span>${esc(b)}</span><small>${bc[b]}</small></button><button class="liftFilterLink" type="button" title="Copiar enlace de ${esc(b)}" aria-label="Copiar enlace de ${esc(b)}" onclick='event.stopPropagation();liftCopyFilterLink("marca",${JSON.stringify(b)})'>🔗</button></div>`).join('')}
    </div>
  </div>
</section>
<section class="filterPanel" ${!isBrands?'':'hidden'}>
  ${cats.map(c=>`<div class="liftCatAdminRow">
    <button class="filterItem ${state.cat===c?'on':''}" onclick='setCat(${JSON.stringify(c)})'><span>${esc(c)}</span><small>${cc[c]}</small></button><button class="liftFilterLink" type="button" title="Copiar enlace de ${esc(c)}" aria-label="Copiar enlace de ${esc(c)}" onclick='event.stopPropagation();liftCopyFilterLink("categoria",${JSON.stringify(c)})'>🔗</button>
  </div>`).join('')}
</section>`;
}
function renderFilters(){
  const h=filterHTML();
  document.getElementById('desktopFilters').innerHTML=h;
  document.getElementById('mobileFilters').innerHTML=h;
}
function setFilterView(view){state.filterView=view;renderFilters()}
function showOffers(){state.offerOnly=!state.offerOnly;state.cat='Todos';state.brand='Todas';fullSearchActive=false;closeQuickSearch();render();document.getElementById('grid').scrollIntoView({behavior:'auto',block:'start'})}
function setCat(c){state.offerOnly=false;state.cat=c;state.brand='Todas';render();if(innerWidth<=760)closeOff()}
function setBrand(b){state.offerOnly=false;state.brand=b;state.cat='Todos';render();if(innerWidth<=760)closeOff()}
function liftViewBrand(brand){
  if(!brand)return;
  fullSearchActive=false;
  const q=document.getElementById('q');
  if(q)q.value='';
  closeQuickSearch();
  state.offerOnly=false;
  state.filterView='brands';
  state.brand=brand;
  state.cat='Todos';
  render();
  if(innerWidth<=760 && typeof closeOff==='function')closeOff();
  requestAnimationFrame(()=>document.getElementById('grid')?.scrollIntoView({behavior:'auto',block:'start'}));
}
function liftViewCategory(category){
  if(!category)return;
  fullSearchActive=false;
  const q=document.getElementById('q');
  if(q)q.value='';
  closeQuickSearch();
  state.offerOnly=false;
  state.filterView='categories';
  state.cat=category;
  state.brand='Todas';
  render();
  if(innerWidth<=760 && typeof closeOff==='function')closeOff();
  requestAnimationFrame(()=>document.getElementById('grid')?.scrollIntoView({behavior:'auto',block:'start'}));
}
function searchProductsAll(value){
  const q=norm(value).trim();
  if(!q)return [];
  const words=q.split(/\s+/).filter(Boolean);
  return liftCatalogGrouped(liftVisibleProducts()).map(p=>{
    const name=norm(p.name), brand=norm(p.brand), category=norm(p.category), description=norm(p.description||''), presentation=norm(p.presentation||''), flavor=norm(p.flavor||''), groupFlavors=norm((p._variantFlavors||[]).join(' ')), pdfName=norm(p.pdfCatalogName||''), pdfFlavors=norm((p.pdfFlavors||[]).join(' ')), directOffer=offerOf(p), groupOffer=p._variantGroupId?liftGroupCardOffer(p):null, offerTerms=(directOffer||groupOffer)?(' ofertas oferta sale'+(directOffer?.gift?' regalo':'')+(groupOffer?' sabores promocion promoción':'')):'', hay=name+' '+brand+' '+category+' '+description+' '+presentation+' '+flavor+' '+groupFlavors+' '+pdfName+' '+pdfFlavors+offerTerms;
    if(!words.every(w=>hay.includes(w)))return null;
    let score=hasOffer(p)?5:0;
    if(name.startsWith(q))score+=100;
    if(name.includes(q))score+=60;
    if(brand.includes(q))score+=30;
    if(category.includes(q))score+=20;
    score+=words.reduce((a,w)=>a+(name.includes(w)?8:0)+(brand.includes(w)?3:0)+(category.includes(w)?2:0),0);
    return {p,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.p.name.localeCompare(b.p.name)).map(x=>x.p);
}
function quickSearchProducts(value){return searchProductsAll(value).slice(0,7)}
let fullSearchActive=false;
function productCards(arr,emptyText='No encontré productos.'){
  return arr.map(p=>{
    const groupFlavorCount=Number(p._variantCount||0);
    const hasFlavor=groupFlavorCount>0 || (typeof flavorsFor==='function' && flavorsFor(p.id).length) || (Array.isArray(p.pdfFlavors)&&p.pdfFlavors.length) || (typeof ISO100_FLAVOR_IMAGES!=='undefined' && Array.isArray(ISO100_FLAVOR_IMAGES[String(p.id)]) && ISO100_FLAVOR_IMAGES[String(p.id)].length);
    return `<article class="card liftVitanessCard" role="link" tabindex="0" onclick="if(!event.target.closest('button,a,input,select,textarea,label,[role=button]')){openLiftProductById(${p.id})}" onkeydown="if(event.key==='Enter'){openLiftProductById(${p.id})}">
      <div class="cardMain">
        <div class="pic">
          ${offerBadges(p)}
          <button class="liftCardFav ${liftFavorites.has(Number(p.id))?'active':''}" type="button" title="Favorito" aria-label="Favorito" onclick="event.stopPropagation();toggleLiftFavorite(${p.id},this)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.3 13A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 7.7 7L12 20.4Z"/></svg></button>
          <img data-lift-card-main="${p.id}" loading="lazy" decoding="async" fetchpriority="low" src="${p.image}" class="${p.blackBgFix?'blackBgFix':''}" alt="${esc(p.name)}">
        </div>
        <div class="body">
          <div class="liftCardSection">${esc(p.brand||'')} · ${esc(p.category||'')}</div>
          <div class="name">${esc(p.name)}</div>
          ${p.presentation?`<div class="liftCardPresentation">${esc(p.presentation)}</div>`:''}
          ${hasFlavor?`<div class="liftCardFlavor">${groupFlavorCount>0?`● ${groupFlavorCount} sabor${groupFlavorCount===1?'':'es'} disponible${groupFlavorCount===1?'':'s'}`:'Opciones / sabores disponibles'}</div>`:''}
          <div class="prices singlePrice"><div class="priceBox">${priceHTML(p)}</div></div>
        </div>
      </div>
      <div class="cardQuickBuy cardQuickActions">
        <button class="addBtn cardQuickBuyBtn" type="button" title="${hasFlavor?'Elegir opciones':'Agregar al carrito'}" aria-label="${hasFlavor?'Elegir opciones':'Agregar al carrito'}" onclick="event.stopPropagation();${hasFlavor?`openLiftProductById(${p.id})`:`add(${p.id})`}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H7"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M14.5 9.5v4M12.5 11.5h4"/></svg><span class="liftBuyLabel">${hasFlavor?'Elegir opciones':'Agregar'}</span></button>
        <button class="cardShareImageBtn" type="button" title="Compartir imagen del producto" aria-label="Compartir imagen del producto" onclick="event.stopPropagation();shareLiftProductImage(${p.id})"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"></circle><circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="19" r="2.5"></circle><path d="M8.2 10.8 15.8 6.3M8.2 13.2l7.6 4.5"></path></svg></button>
        <span class="liftCardAdminMenuWrap">
          <button class="liftAdminMenuToggle" type="button" title="Opciones del producto" aria-label="Opciones del producto" onclick="event.stopPropagation();liftToggleAdminMenu(this)">⋮</button>
          <span class="liftAdminDropdown" onclick="event.stopPropagation()">
            <button type="button" onclick="liftCopyFilterLink('producto',String(${p.id}));liftCloseAdminMenus()"><span aria-hidden="true">🔗</span><span class="srOnly">Copiar enlace</span></button>
            <button type="button" onclick="liftMoveProductMenu(${p.id});liftCloseAdminMenus()"><span aria-hidden="true">↪</span><span class="srOnly">Mover categoría o laboratorio</span></button>
            <button type="button" onclick="liftCardAdminDuplicate(${p.id});liftCloseAdminMenus()"><span aria-hidden="true">⧉</span><span class="srOnly">Duplicar producto</span></button>
            <button type="button" onclick="liftCardEditVariants(${p.id});liftCloseAdminMenus()"><span aria-hidden="true">◫</span><span class="srOnly">Editar variaciones</span></button>
            <button type="button" onclick="liftCardAdminEdit(${p.id});liftCloseAdminMenus()"><span aria-hidden="true">✎</span><span class="srOnly">Editar producto</span></button>
            <button type="button" class="danger" onclick="liftCardAdminDelete(${p.id});liftCloseAdminMenus()"><span aria-hidden="true">⌫</span><span class="srOnly">Eliminar producto</span></button>
          </span>
        </span>
      </div>
    </article>`;
  }).join('')||`<div class="empty">${emptyText}</div>`;
}
function showAllSearchResults(value){
  const term=(value??document.getElementById('q').value).trim();
  if(!term)return;
  state.offerOnly=false;updateOffersButton();
  const arr=searchProductsAll(term);
  fullSearchActive=true;
  closeQuickSearch();
  document.getElementById('status').textContent=`${arr.length} resultados para “${term}”`;
  renderProductListProgressive(arr,'No encontré productos con esa búsqueda.');
  document.getElementById('grid').scrollIntoView({behavior:'auto',block:'start'});
}
function renderQuickSearch(value){
  const box=document.getElementById('searchResults');
  const q=value.trim();
  if(!q){box.classList.remove('show');box.innerHTML='';if(fullSearchActive){fullSearchActive=false;render()}return;}
  const all=searchProductsAll(value);
  const results=all.slice(0,7);
  const rows=results.length?results.map(p=>`<div class="searchResult"><img class="searchThumb" loading="lazy" decoding="async" fetchpriority="low" data-lift-product="${p.id}" src="${String(p.image).includes('drive.google.com/thumbnail')?String(p.image).replace(/&sz=w\d+/i,'&sz=w240'):p.image}" alt="${esc(p.name)}" title="Ver producto"><div class="searchInfo"><div class="searchName">${esc(p.name)}</div><div class="searchBrand">${esc(p.brand)} · ${esc(p.category)}</div><div class="searchPrice">${fmt(priceOf(p))}${savingOf(p)?`<span class="searchOldPrice">${fmt(compareAtOf(p))}</span>`:''}</div>${savingOf(p)?`<div class="searchSaving">Ahorras ${fmt(savingOf(p))}</div>`:''}${offerOf(p)?.gift?'<div class="searchSaving">🎁 Incluye regalo</div>':''}${offerOf(p)?.flavors?.length?`<div class="searchFlavor">Sabores: ${offerOf(p).flavors.map(esc).join(' · ')}</div>`:''}</div><div class="searchActions"><button class="searchAdd" onclick="event.stopPropagation();add(${p.id})">Agregar</button><button class="searchBuy" onclick="buyProduct(${p.id});closeQuickSearch()">Comprar</button></div></div>`).join(''):'<div class="searchEmpty">No encontré productos entre las sugerencias rápidas.</div>';
  const allButton=`<div class="searchAllWrap"><button class="searchAllBtn" onclick="showAllSearchResults()">Ver todos los resultados${all.length?` (${all.length})`:''}</button></div>`;
  box.innerHTML=rows+allButton;
  box.classList.add('show');
}
function closeQuickSearch(){document.getElementById('searchResults').classList.remove('show')}
const searchInput=document.getElementById('q');
searchInput.addEventListener('input',e=>renderQuickSearch(e.target.value));
searchInput.addEventListener('focus',e=>{if(e.target.value.trim())renderQuickSearch(e.target.value)});
searchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();showAllSearchResults(e.target.value)}});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))closeQuickSearch()});
const FLAVOR_CONFIRM_MSG='💬 Si el producto maneja sabores, se confirman por WhatsApp según disponibilidad.';
function flavorMessageFor(){return FLAVOR_CONFIRM_MSG}
function openOff(id){document.getElementById(id).classList.add('open');document.getElementById('overlay').classList.add('show');document.body.style.overflow='hidden';if(id==='cart'){renderCart();liftRenderSideSuggestions()}} function closeOff(){document.querySelectorAll('.off').forEach(x=>x.classList.remove('open'));document.getElementById('overlay').classList.remove('show');document.body.style.overflow='';document.getElementById('liftSideSuggestions')?.classList.remove('visible');document.body.classList.remove('liftSideSuggestionsActive')}
function cartKeyFor(id,meta=null){
  return meta&&meta.flavor ? `${id}::${meta.flavor}` : String(id);
}
function addVariant(id,flavor,image,variantMeta=null,quantity=1){
  const cleanFlavor=String(flavor||'').trim();
  if(!cleanFlavor){add(id,null,quantity);return}
  const legacyKey=String(id);
  if(cart[legacyKey]){
    delete cart[legacyKey];
    delete cartMeta[legacyKey];
  }
  const key=`${id}::${cleanFlavor}`;
  cart[key]=(cart[key]||0)+Math.max(1,Math.min(99,Math.floor(Number(quantity)||1)));
  cartMeta[key]={flavor:cleanFlavor,image:image||resolveVariantImage(id,cleanFlavor,''),...(variantMeta||{})};
  window.LIFT_CART_META=cartMeta;
  saveCart();
  renderCart();
  openOff('cart');
}
function productIdFromCartKey(key){
  return String(key).split('::')[0];
}
function add(id,meta=null,quantity=1){
  const key=cartKeyFor(id,meta);
  cart[key]=(cart[key]||0)+Math.max(1,Math.min(99,Math.floor(Number(quantity)||1)));
  if(meta&&meta.flavor){
    cartMeta[key]={flavor:meta.flavor,image:meta.image||''};
    window.LIFT_CART_META=cartMeta;
  }
  saveCart();renderCart();openOff('cart')
}
function change(key,d){
  key=String(key);
  cart[key]=(cart[key]||0)+d;
  if(cart[key]<=0){delete cart[key];delete cartMeta[key]}
  saveCart();renderCart()
}
function removeItem(key){
  key=String(key);
  delete cart[key];
  delete cartMeta[key];
  saveCart();renderCart()
}
function saveCart(){
  localStorage.setItem('liftCartV2',JSON.stringify(cart));
  localStorage.setItem('liftCartMetaV1',JSON.stringify(cartMeta));
  updateCount()
}
function flavorFromCartKey(key){
  const parts=String(key).split('::');
  return parts.length>1 ? parts.slice(1).join('::') : '';
}
function resolveVariantImage(id,flavor,fallback=''){
  try{
    const list=(typeof ISO100_FLAVOR_IMAGES!=='undefined' && ISO100_FLAVOR_IMAGES[String(id)])||[];
    const hit=list.find(x=>x.name===flavor);
    return hit?.image||fallback;
  }catch(e){return fallback}
}
function items(){
  return Object.entries(cart).map(([key,q])=>{
    const id=productIdFromCartKey(key);
    const base=PRODUCTS.find(x=>x.id==id);
    if(!base)return null;
    const parsedFlavor=flavorFromCartKey(key);
    const stored=cartMeta[key]||{};
    const flavor=stored.flavor||parsedFlavor;
    const image=stored.image||resolveVariantImage(id,flavor,base.image)||base.image;
    let p=flavor?{...base,image,_cartFlavor:flavor}:base;
    if(stored.groupId){
      const g=typeof liftGroupById==='function'?liftGroupById(stored.groupId):null;
      const vv=g&&typeof liftGroupVariants==='function'?liftGroupVariants(g):[];
      const v=vv.find(x=>String(x.id)===String(stored.variantId))||vv.find(x=>String(x.sabor||'').trim().toLowerCase()===String(flavor||'').trim().toLowerCase());
      const vp=v&&typeof liftVariantProduct==='function'?liftVariantProduct(v):base;
      const vprice=g&&v&&typeof liftVariantNormalPrice==='function'?liftVariantNormalPrice(g,v,vp):Number(base.price||0);
      p={...(vp||base),
        id:v&&vp?vp.id:base.id,
        _variantProductId:v&&vp?vp.id:null,
        _isVariantGroupCard:false,
        name:String(g?.nombre||base.name||''),
        brand:String(g?.marca||base.brand||''),
        category:String(g?.categoria||base.category||''),
        presentation:String(g?.presentacion||base.presentation||''),
        price:vprice||base.price,
        image:stored.image||v?.imagen||vp?.image||g?.imagen||base.image,
        flavor:stored.flavor||v?.sabor||flavor,
        _cartFlavor:stored.flavor||v?.sabor||flavor,
        _variantGroupId:Number(g?.id||stored.groupId),
        _variantId:Number(v?.id||stored.variantId)
      };
    }
    return {key,p,q};
  }).filter(Boolean)
} function updateCount(){const n=Object.values(cart).reduce((a,b)=>a+b,0);document.getElementById('count').textContent=n;document.getElementById('count2').textContent=n}
function shippingProgressHTML(qty,cityName=''){
  if(!qty)return '';
  const city=norm(cityName||'');
  const localCities=['medellin','bello','itagui','envigado','sabaneta','la estrella'];
  const exact=!!cityName;
  const local=localCities.includes(city);
  const one=(label,kind)=>{
    if(kind==='local'){
      if(qty===1)return `<b>${label}:</b> agrega 1 producto más y el envío baja a ${fmt(7000)}.`;
      if(qty===2)return `<b>${label}:</b> agrega 1 producto más y obtienes envío gratis.`;
      return `<b>${label}:</b> ya tienes envío gratis.`;
    }
    if(qty===1)return `<b>${label}:</b> agrega 1 producto más y el envío baja a ${fmt(12000)}.`;
    if(qty===2)return `<b>${label}:</b> agrega 1 producto más y el envío baja a ${fmt(10000)}.`;
    if(qty===3)return `<b>${label}:</b> agrega 1 producto más y obtienes envío gratis.`;
    return `<b>${label}:</b> ya tienes envío gratis.`;
  };
  return `<div class="shippingProgress">${exact?one(local?'Tu zona':'Envío nacional',local?'local':'national'):`${one('Medellín y zona local','local')}<br>${one('Resto del país','national')}`}</div>`;
}
function relatedProductsFor(its,limit=4){
  const ids=new Set(its.map(x=>x.p.id));
  const cats=new Set(its.map(x=>x.p.category));
  const brandsSet=new Set(its.map(x=>x.p.brand));
  const candidates=PRODUCTS.filter(p=>!ids.has(p.id)&&!cats.has(p.category));
  const sameBrand=candidates
    .filter(p=>brandsSet.has(p.brand))
    .sort((a,b)=>(hasOffer(b)?1:0)-(hasOffer(a)?1:0)||a.name.localeCompare(b.name,'es'));
  const chosen=[...sameBrand];
  if(chosen.length<limit){
    const chosenIds=new Set(chosen.map(p=>p.id));
    const fallback=candidates
      .filter(p=>!chosenIds.has(p.id))
      .sort((a,b)=>(hasOffer(b)?1:0)-(hasOffer(a)?1:0)||a.name.localeCompare(b.name,'es'));
    chosen.push(...fallback);
  }
  return chosen.slice(0,limit);
}
function liftCartSuggestionsDismissed(){try{return localStorage.getItem('liftSideSuggestionsDismissed')==='1'}catch(e){return !!window._liftSideSuggestionsDismissed}}
function liftDismissSideSuggestions(){
 window._liftSideSuggestionsDismissed=true;
 try{localStorage.setItem('liftSideSuggestionsDismissed','1')}catch(e){}
 const side=document.getElementById('liftSideSuggestions');if(side)side.classList.remove('visible');
 document.body.classList.remove('liftSideSuggestionsActive');
}
function relatedHTML(its){return '';}
function liftRenderSideSuggestions(){
 let side=document.getElementById('liftSideSuggestions');
 if(!side){side=document.createElement('section');side.id='liftSideSuggestions';side.setAttribute('aria-label','Productos recomendados');document.body.appendChild(side)}
 const cartOpen=document.getElementById('cart')?.classList.contains('open');
 if(!cartOpen||liftCartSuggestionsDismissed()){
   side.classList.remove('visible');document.body.classList.remove('liftSideSuggestionsActive');return;
 }
 const rel=relatedProductsFor(items());
 if(!rel.length){side.classList.remove('visible');document.body.classList.remove('liftSideSuggestionsActive');return}
 side.innerHTML=`<div class="liftSideSuggestionsHeader"><div><strong>También te puede interesar</strong><small>Complementa tu pedido</small></div><button type="button" class="liftSideDismiss" onclick="liftDismissSideSuggestions()" aria-label="Cerrar recomendaciones para siempre" title="No volver a mostrar">×</button></div><div class="liftSideSuggestionsItems">${rel.map(p=>`<div class="liftSideSuggestionItem"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy"><div class="liftSideSuggestionInfo"><span>${esc(p.name)}</span><b>${fmt(priceOf(p))}</b><button type="button" onclick="event.stopPropagation();add(${p.id})">+ Agregar</button></div></div>`).join('')}</div>`;
 document.body.classList.add('liftSideSuggestionsActive');
 requestAnimationFrame(()=>side.classList.add('visible'));
}
function renderCart(){const its=items(),body=document.getElementById('cartBody');if(!its.length)body.innerHTML='<div class="empty">Tu carrito está vacío.</div>';else{const msg=flavorMessageFor(its);body.innerHTML=its.map(({key,p,q})=>{const k=JSON.stringify(String(key));return `<div class="cartline"><img class="cartProductImg" src="${p.image}" alt="${esc(p.name)}${p._cartFlavor?' - '+esc(p._cartFlavor):''}"><div class="cartProductInfo"><div class="cartname">${esc(p.name)}</div><div class="cartbrand">${esc(p.brand)}</div>${p._cartFlavor?`<div class="cartFlavor">Sabor: <b>${esc(p._cartFlavor)}</b></div>`:''}${hasOffer(p)?offerUntilHTML(p,'cartOfferUntil'):''}<div class="cartProductControls"><div class="cartprice">${savingOf(p)?`<span class="cartOldPrice">${fmt(compareAtOf(p)*q)}</span>`:''}<span class="${savingOf(p)?'promoPrice':''}">${fmt(priceOf(p)*q)}</span></div><div class="qty"><button aria-label="Disminuir cantidad" onclick='change(${k},-1)'>−</button><b>${q}</b><button aria-label="Aumentar cantidad" onclick='change(${k},1)'>+</button></div></div></div><button class="trash" aria-label="Eliminar producto" title="Eliminar" onclick='removeItem(${k})'>×</button></div>`}).join('')+relatedHTML(its)}document.getElementById('subtotal').textContent=fmt(its.reduce((s,x)=>s+priceOf(x.p)*x.q,0));const progress=document.getElementById('cartShippingProgress');if(progress)progress.innerHTML='';const cb=document.getElementById('cartBuyBtn');if(cb)cb.disabled=!its.length;updateCount()}
const liftOriginalRenderCart=renderCart;
renderCart=function(...args){const result=liftOriginalRenderCart.apply(this,args);liftRenderSideSuggestions();return result};

function viewProduct(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;const a=p._attr;document.getElementById('modalContent').innerHTML=`<div class="modalPic"><img src="${p.image}" class="${p.blackBgFix?'blackBgFix':''}" alt="${esc(p.name)}"></div><div class="modalMeta"><span class="tag">${esc(p.brand)}</span><span class="tag">${esc(p.category)}</span>${a.weight?`<span class="tag">${esc(a.weight.label)}</span>`:''}${a.services?`<span class="tag">${a.services} servicios</span>`:''}</div><div class="modalName">${esc(p.name)}</div>${(p.description||p.presentation||p.flavor)?`<div class="modalPdfInfo">${p.description?`<div><b>${esc(p.description)}</b></div>`:''}${p.presentation?`<div>${esc(p.presentation)}</div>`:''}${p.flavor?`<div>Sabor: ${esc(p.flavor)}</div>`:''}</div>`:''}<div class="modalPrice">${savingOf(p)?`<span class="modalOldPrice">${fmt(compareAtOf(p))}</span>`:''}${fmt(priceOf(p))}</div>${savingOf(p)?`<div class="modalSaving">Ahorras ${fmt(savingOf(p))}</div>`:''}${offerOf(p)?.gift?'<div class="giftBadge">🎁 Incluye regalo</div>':''}<button class="add" style="width:100%" onclick="add(${p.id});closeModal()">Agregar al carrito</button>`;document.getElementById('productModal').classList.add('open');document.body.style.overflow='hidden'}
function closeModal(){document.getElementById('productModal').classList.remove('open');document.body.style.overflow=''}
let checkoutMode='cart';
let checkoutSingleId=null;
let selectedCity=null;
let cityData=[];
const CITY_URL='https://raw.githubusercontent.com/proyecto26/colombia/master/cities.json';
const DEPT_URL='https://raw.githubusercontent.com/proyecto26/colombia/master/departments.json';
const fallbackCities=[
{name:'Medellín',department:'Antioquia'},{name:'Bogotá D.C.',department:'Bogotá D.C.'},{name:'Cali',department:'Valle del Cauca'},{name:'Barranquilla',department:'Atlántico'},{name:'Cartagena',department:'Bolívar'},{name:'Bucaramanga',department:'Santander'},{name:'Pereira',department:'Risaralda'},{name:'Manizales',department:'Caldas'},{name:'Armenia',department:'Quindío'},{name:'Santa Marta',department:'Magdalena'},{name:'Cúcuta',department:'Norte de Santander'},{name:'Villavicencio',department:'Meta'},{name:'Ibagué',department:'Tolima'},{name:'Montería',department:'Córdoba'},{name:'Neiva',department:'Huila'},{name:'Pasto',department:'Nariño'},{name:'Bello',department:'Antioquia'},{name:'Envigado',department:'Antioquia'},{name:'Itagüí',department:'Antioquia'},{name:'Sabaneta',department:'Antioquia'}];
async function loadCities(){if(cityData.length)return;try{const [cr,dr]=await Promise.all([fetch(CITY_URL),fetch(DEPT_URL)]);if(!cr.ok||!dr.ok)throw new Error('city fetch');const cj=await cr.json(),dj=await dr.json();const dm=Object.fromEntries(dj.data.map(d=>[d.id,d.name]));cityData=cj.data.map(c=>({name:c.name,department:dm[c.departmentId]||''})).sort((a,b)=>a.name.localeCompare(b.name,'es'));}catch(e){cityData=fallbackCities}}
function checkoutItemsList(){
  if(checkoutMode==='single'){
    const base=PRODUCTS.find(x=>x.id===checkoutSingleId);
    if(!base)return [];
    const meta=window.LIFT_SINGLE_META;
    const p=meta&&String(meta.id)===String(base.id)?{...base,image:meta.image||base.image,_cartFlavor:meta.flavor||'',_isVariantGroupCard:false}:base;
    return [{p,q:1}]
  }
  return items()
}
function checkoutQty(){return checkoutItemsList().reduce((n,x)=>n+x.q,0)}
function shippingFor(cityName,qty){if(!cityName||!qty)return null;const city=norm(cityName);const localCities=['medellin','bello','itagui','envigado','sabaneta','la estrella'];const local=localCities.includes(city);if(local){if(qty===1)return 11000;if(qty===2)return 7000;return 0}if(qty===1)return 15000;if(qty===2)return 12000;if(qty===3)return 10000;return 0}
let appliedCoupon=null;
function setCouponStatus(text,type=''){const el=document.getElementById('couponStatus');if(!el)return;el.textContent=text;el.className='couponStatus'+(type?' '+type:'')}
async function applyCoupon(){
  appliedCoupon=null;
  const code=String(document.getElementById('coCoupon')?.value||'').trim();
  const phone=String(document.getElementById('coPhone')?.value||'').trim();
  if(!code){setCouponStatus('Escribe el código del cupón.','err');renderCheckoutSummary();return}
  if(!phone){setCouponStatus('Escribe primero el celular asociado al pedido.','err');renderCheckoutSummary();return}
  const btn=document.getElementById('couponApplyBtn');if(btn)btn.disabled=true;
  setCouponStatus('Validando beneficio...','');
  try{
    const data=await liftCouponRpc('validate_coupon',checkoutCouponPayload());
    if(!data?.valid){
      appliedCoupon=null;
      setCouponStatus(couponReasonText(data?.reason,data||{}),'err');
      renderCheckoutSummary();
      return;
    }
    appliedCoupon={
      code:data.code||code.toUpperCase(),
      type:data.coupon_type||'manual',
      discountType:data.discount_type||'fixed',
      discount:Number(data.discount_amount||0),
      min:Number(data.min_subtotal||0),
      scopeType:data.scope_type||'all',
      scopeValue:data.scope_value||null
    };
    if(appliedCoupon.discountType==='trainer_price'){
      const d=checkoutCouponDiscount();
      setCouponStatus(`🏋️ Precio entrenador activado · Ahorras ${fmt(d)}`,'ok');
    }else{
      setCouponStatus(`Cupón ${appliedCoupon.code} aplicado · Ahorras ${fmt(appliedCoupon.discount)}`,'ok');
    }
    renderCheckoutSummary();
  }catch(e){
    appliedCoupon=null;
    console.error('Cupón:',e);
    setCouponStatus('No pude validar el cupón. Revisa la conexión e intenta de nuevo.','err');
    renderCheckoutSummary();
  }finally{if(btn)btn.disabled=false}
}

function openCheckout(){if(typeof gtag==='function')gtag('event','begin_checkout',{currency:'COP'});closeOff();document.getElementById('checkoutModal').classList.add('open');document.body.style.overflow='hidden';selectedCity=null;appliedCoupon=null;document.getElementById('coCity').value='';const ci=document.getElementById('coCoupon');if(ci)ci.value='';setCouponStatus('Ingresa tu código y celular para validar el beneficio.','');loadCities();renderCheckoutSummary()}
function closeCheckout(){document.getElementById('checkoutModal').classList.remove('open');document.getElementById('cityResults').classList.remove('show');document.body.style.overflow=''}
function startCartCheckout(){
  if(!items().length)return;
  checkoutMode='cart';
  checkoutSingleId=null;
  saveCart();
  openCheckout();
  renderCheckoutSummary();
}
function buyProduct(id){checkoutMode='single';checkoutSingleId=id;openCheckout()}
function renderCheckoutSummary(){
  const its=checkoutItemsList();
  const sub=checkoutPublicSubtotal(its);
  const effectiveSub=checkoutEffectiveSubtotal(its);
  const ship=adminTrainerMode()?11000:shippingFor(selectedCity?.name||'',checkoutQty());
  if(appliedCoupon&&sub<Number(appliedCoupon.min||0)){
    appliedCoupon=null;
    setCouponStatus('El subtotal cambió y el cupón debe validarse nuevamente.','');
  }
  const discount=checkoutCouponDiscount(its);
  document.getElementById('checkoutItems').innerHTML=`<div class="checkoutProductList">${its.map(x=>{
    const pub=priceOf(x.p),eff=checkoutUnitPrice(x.p),isTrainer=(adminTrainerMode()||trainerCouponActive())&&eff<pub;
    return `<div class="checkoutProduct"><img class="checkoutProductImg" src="${x.p.image}" alt="${esc(x.p.name)}"><div class="checkoutProductInfo"><div class="checkoutProductName"><span class="liftInlineQty">${x.q} ×</span> ${esc(x.p.name)}${x.p._cartFlavor?` <span class="liftInlineFlavor">· ${esc(x.p._cartFlavor)}</span>`:''} <span class="liftInlineBrand">· ${esc(x.p.brand || x.p.marca || 'Sin marca')}</span></div>${hasOffer(x.p)?offerUntilHTML(x.p,'checkoutOfferUntil'):''}${x.q>1?`<span class="checkoutProductQty">${x.q} unidades</span>`:''}${isTrainer?`<div style="font-size:10px;color:#168451;margin-top:4px">🏋️ Precio entrenador</div>`:''}</div><div class="checkoutProductPrice">${isTrainer?`<div class="checkoutOldPrice">${fmt(pub*x.q)}</div><span class="promoPrice">${fmt(eff*x.q)}</span>`:(savingOf(x.p)?`<div class="checkoutOldPrice">${fmt(compareAtOf(x.p)*x.q)}</div><span class="promoPrice">${fmt(eff*x.q)}</span>`:fmt(eff*x.q))}${(x.p._manualProduct||x.p._checkoutOnly)?`<button type="button" class="liftManualRemove" title="Sacar del pedido" onclick="liftRemoveManualCheckoutItem(decodeURIComponent('${encodeURIComponent(String(x.key))}'))">×</button>`:''}</div></div>`;
  }).join('')}</div>`;
  const prog=document.getElementById('checkoutShippingProgress');
  if(prog)prog.innerHTML='';
  const trainerActive=adminTrainerMode()||trainerCouponActive();
  document.getElementById('coSubtotal').textContent=fmt(trainerActive?effectiveSub:sub);
  const subtotalLabel=document.querySelector('#coSubtotal')?.closest('.checkoutLine')?.querySelector('span');
  if(subtotalLabel)subtotalLabel.textContent=trainerActive?'Subtotal entrenador':'Subtotal';
  const dl=document.getElementById('coDiscountLine');
  if(dl)dl.style.display=(!trainerActive&&discount)?'flex':'none';
  if(discount&&!trainerActive){
    document.getElementById('coDiscountLabel').textContent=`Cupón ${appliedCoupon.code}`;
    document.getElementById('coDiscount').textContent='-'+fmt(discount);
  }
  document.getElementById('coShipping').textContent=ship===null?'Selecciona ciudad':(ship===0?'Gratis':fmt(ship));
  document.getElementById('coTotal').textContent=fmt(Math.max(0,effectiveSub-((adminTrainerMode()||trainerCouponActive())?0:discount))+(ship||0));
}
function showCityResults(term=''){const box=document.getElementById('cityResults');const q=norm(term);const rows=(cityData.length?cityData:fallbackCities).filter(c=>!q||norm(c.name+' '+c.department).includes(q)).slice(0,80);box.innerHTML=rows.map((c,i)=>`<button type="button" class="cityOption" data-i="${i}" data-name="${esc(c.name)}" data-dept="${esc(c.department)}"><span>${esc(c.name)}</span><small>${esc(c.department)}</small></button>`).join('')||'<div class="cityOption">No encontré esa ciudad.</div>';box.classList.add('show');box.querySelectorAll('button[data-name]').forEach(btn=>btn.addEventListener('click',()=>selectCity(btn.dataset.name,btn.dataset.dept)))}
function selectCity(name,department){selectedCity={name,department};document.getElementById('coCity').value=department?`${name} · ${department}`:name;document.getElementById('cityResults').classList.remove('show');window.liftUpdateDocumentField?.();renderCheckoutSummary()}
const coCity=document.getElementById('coCity');coCity.addEventListener('focus',async()=>{await loadCities();showCityResults(coCity.value)});coCity.addEventListener('input',async e=>{selectedCity=null;await loadCities();showCityResults(e.target.value);renderCheckoutSummary()});document.addEventListener('click',e=>{if(!e.target.closest('.cityWrap'))document.getElementById('cityResults').classList.remove('show')});
const coPhone=document.getElementById('coPhone');if(coPhone)coPhone.addEventListener('input',()=>{if(appliedCoupon){appliedCoupon=null;setCouponStatus('El celular cambió. Valida nuevamente el cupón.','');renderCheckoutSummary()}});const coCoupon=document.getElementById('coCoupon');if(coCoupon){coCoupon.addEventListener('input',()=>{if(appliedCoupon){appliedCoupon=null;setCouponStatus('El código cambió. Presiona Aplicar para validarlo de nuevo.','');renderCheckoutSummary()}});coCoupon.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyCoupon()}})};
function checkoutText(){
  const name=document.getElementById('coName').value.trim(),phone=document.getElementById('coPhone').value.trim(),address=document.getElementById('coAddress').value.trim(),notes=document.getElementById('coNotes').value.trim();
  if(!name||!phone||!address||!selectedCity){alert('Completa nombre, celular, dirección y selecciona una ciudad de la lista.');return ''}
  const its=checkoutItemsList();if(!its.length)return '';
  const sub=checkoutPublicSubtotal(its),effectiveSub=checkoutEffectiveSubtotal(its),ship=adminTrainerMode()?11000:shippingFor(selectedCity.name,checkoutQty()),discount=checkoutCouponDiscount(its),total=Math.max(0,effectiveSub-((adminTrainerMode()||trainerCouponActive())?0:discount))+(ship||0);
  const moneySpace=v=>fmt(v).replace(/^\$\s*/, '$ ');
  const lines=[`Hola, quiero confirmar este pedido:`,``,`Nombre: ${name}`,`Celular: ${phone}`,`Dirección: ${address}`,`Ciudad: ${selectedCity.name}${selectedCity.department?' · '+selectedCity.department:''}`,notes?`Notas: ${notes}`:'',``,`Pedido:`];
  its.forEach(({p,q})=>{
    const pub=priceOf(p),eff=checkoutUnitPrice(p),flavor=p._cartFlavor?' · Sabor: '+p._cartFlavor:'';
    const presentation=p.presentation?' · '+p.presentation:'';
    const brand=p.brand||p.marca||'';
    const productName=`${p.name}${brand?' · '+brand:''}${presentation}${flavor}`;
    if(q>1) lines.push(`${q} -  ${productName}  · (${moneySpace(eff)} c/u) - ${moneySpace(eff*q)}`);
    else lines.push(`${q} -  ${productName}  · ${moneySpace(eff)} c/u`);
  });
  const trainerActive=adminTrainerMode()||trainerCouponActive();
  lines.push('',`${trainerActive?'Subtotal entrenador':'Subtotal público'}: ${moneySpace(trainerActive?effectiveSub:sub)}`);
  if(appliedCoupon&&discount&&!trainerCouponActive())lines.push(`Cupón ${appliedCoupon.code}: -${moneySpace(discount)}${appliedCoupon.type==='referido'?' (Referido)':''}`);
  lines.push(`Envío: ${ship===0?'GRATIS':moneySpace(ship)}`,`Total: ${moneySpace(total)}`);
  return lines.filter((v,i)=>v!=='' || i===1 || i===7 || i===lines.length-4).join('\n');
}
function providerCheckoutComplete(){
  const name=document.getElementById('coName')?.value.trim()||'',phone=document.getElementById('coPhone')?.value.trim()||'',address=document.getElementById('coAddress')?.value.trim()||'';
  return !!(name&&phone&&address&&selectedCity);
}
function liftUpdateProviderMode(){
  const el=document.getElementById('liftProviderMode');if(!el)return;
  const complete=providerCheckoutComplete();
  el.classList.toggle('complete',complete);
  el.textContent=complete?'Pedido proveedor · datos completos, se guardará en Supabase':'Cotización proveedor · no requiere nombre, celular, dirección ni ciudad';
}
function providerCheckoutText(){
  const greeting=document.getElementById('liftProviderGreeting')?.value.trim()||'';
  const name=document.getElementById('coName')?.value.trim()||'',phone=document.getElementById('coPhone')?.value.trim()||'',address=document.getElementById('coAddress')?.value.trim()||'',notes=document.getElementById('coNotes')?.value.trim()||'';
  const its=checkoutItemsList();if(!its.length){alert('Agrega al menos un producto al pedido.');return ''}
  const lines=[];
  if(greeting)lines.push(greeting,'');
  // Siempre arma el mensaje con los datos disponibles, aunque el pedido esté incompleto.
  if(name)lines.push(`Nombre: ${name}`);
  if(phone)lines.push(`Celular: ${phone}`);
  if(address)lines.push(`Dirección: ${address}`);
  if(selectedCity?.name)lines.push(`Ciudad: ${selectedCity.name}${selectedCity.department?' · '+selectedCity.department:''}`);
  if(notes)lines.push(`Notas: ${notes}`);
  if(name||phone||address||selectedCity?.name||notes)lines.push('');
  lines.push(`Pedido:`);
  its.forEach(({p,q})=>{
    const brand=p.brand||p.marca||'';
    const presentation=p.presentation?' · '+p.presentation:'';
    const flavor=p._cartFlavor?' · Sabor: '+p._cartFlavor:'';
    lines.push(`${q} -  ${p.name}${brand?' · '+brand:''}${presentation}${flavor}`);
  });
  // El valor a cobrar incluye el domicilio configurado en checkout.
  const productSub=checkoutEffectiveSubtotal(its);
  const autoShip=adminTrainerMode()?11000:shippingFor(selectedCity?.name||'',checkoutQty());
  const ship=(typeof window.liftAdminShippingValue==='function')?window.liftAdminShippingValue(autoShip):autoShip;
  const totalCobro=productSub+(Number(ship)||0);
  lines.push('','',`Total a pagar: ${fmt(totalCobro)}`,`Realiza el pago antes del despacho por transferencia a esta cuenta:`,'',`Titular: Edwin Fernando Muñoz Tobon`,`🏦 Bancolombia ahorros`,`# 36655023431  / 🔑Llave  @edwin4518`);
  return lines.join('\n');
}
const LIFT_PROVIDERS=[
  {name:'Daniel',phone:'573116026548'},
  {name:'Andrés',phone:'573007700020'},
  {name:'Golem Nutrition',phone:'573137129643'},
  {name:'Mutantes',phone:'573135415970'},
  {name:'Suas',phone:'573132766723'},
  {name:'Vitaness Distribuidor',phone:'573208352352'},
  {name:'MAXFITNESS',phone:'573156168490'},
  {name:'Cooper 3',phone:'573016803587'},
  {name:'Evolución Muscular',phone:'573018189316'},
  {name:'Tópico',phone:'573243563803'},
  {name:'Pablo 20-20 Venom',phone:'573207440650'}
];
function renderProviderButtons(){
  const box=document.getElementById('liftProviderButtons');if(!box)return;
  box.innerHTML=LIFT_PROVIDERS.map((x,i)=>`<button type="button" class="checkoutProviderBtn" onclick="finishProviderCheckout(${i})">${esc(x.name)}</button>`).join('');
  liftUpdateProviderMode();
}
let LIFT_LAST_PROVIDER_SAVED_SIGNATURE='';
async function finishProviderCheckout(providerIndex){
  if(!document.body.classList.contains('liftAdminUnlocked'))return;
  const provider=LIFT_PROVIDERS[Number(providerIndex)];if(!provider)return;
  const t=providerCheckoutText();if(!t)return;
  const url=`https://wa.me/${provider.phone}?text=${encodeURIComponent(t)}`;
  const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'')||(navigator.maxTouchPoints||0)>1;
  // En móvil WhatsApp debe abrir directamente desde el toque, sin esperar Supabase ni portapapeles.
  if(mobile){
    try{navigator.clipboard?.writeText(t).catch(()=>{})}catch(e){}
    window.location.href=url;
    return;
  }
  // Proveedor solo comparte. Nunca guarda pedidos.
  try{await navigator.clipboard.writeText(t)}catch(e){}
  window.open(url,'_blank','noopener');
}
window.LIFT_PROVIDERS=LIFT_PROVIDERS;
window.renderProviderButtons=renderProviderButtons;
window.providerCheckoutText=providerCheckoutText;
window.providerCheckoutComplete=providerCheckoutComplete;
window.liftUpdateProviderMode=liftUpdateProviderMode;
window.finishProviderCheckout=finishProviderCheckout;
['coName','coPhone','coAddress','coCity'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>setTimeout(liftUpdateProviderMode,0)));
renderProviderButtons();
async function registerCouponUse(){
  if(!appliedCoupon)return true;
  try{
    const payload=checkoutCouponPayload();
    const ref=`LIFT-${Date.now()}`;
    const data=await liftCouponRpc('redeem_coupon_v2',{
      p_code:payload.p_code,
      p_phone:payload.p_phone,
      p_subtotal:payload.p_subtotal,
      p_order_reference:ref,
      p_categories:payload.p_categories,
      p_brands:payload.p_brands,
      p_discount_override:trainerCouponActive()?checkoutCouponDiscount():null
    });
    if(data?.success===false){
      const v=data.validation||{};
      setCouponStatus(couponReasonText(v.reason||data.reason,v),'err');
      return false;
    }
    return true;
  }catch(e){
    console.error('Registro cupón:',e);
    return true;
  }
}
async function finishCheckout(){
  const t=checkoutText();if(!t)return;
  const popup=window.open('about:blank','_blank');
  const ok=await registerCouponUse();
  if(!ok){if(popup)popup.close();return}
  const url='https://wa.me/?text='+encodeURIComponent(t);
  if(popup)popup.location.href=url;else window.location.href=url;
}
function orderText(){const its=items();if(!its.length)return '';const lines=['Pedido:',''];its.forEach(({p,q})=>lines.push(`⚡ ${q} ${p.name}${p.presentation?' · '+p.presentation:''}${p._cartFlavor?' · Sabor: '+p._cartFlavor:''} – ${p.brand} · ${fmt(priceOf(p))} c/u${offerOf(p)?.gift?' · 🎁 Incluye regalo':''}`));const sub=its.reduce((s,x)=>s+priceOf(x.p)*x.q,0);lines.push('',`Subtotal: ${fmt(sub)}`);return lines.join('\n')}
async function copyOrder(){const t=orderText();if(!t)return;try{await navigator.clipboard.writeText(t);alert('Pedido copiado.')}catch(e){prompt('Copia el pedido:',t)}}

// Base principal disponible para los módulos externos del catálogo.
window.PRODUCTS = PRODUCTS;
window.LIFT_PRODUCTS = PRODUCTS;

updateCount();render();renderCart();

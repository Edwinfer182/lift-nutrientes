
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const SB='https://vdxkknftyssjyfbdieqa.supabase.co';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 let settings=null,settingError='';
 async function loadSettings(){
  try{const r=await fetch(SB+'/rest/v1/lift_catalog_config?select=valor&clave=eq.seo_merchant_settings&limit=1',{headers:{apikey:KEY},cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const a=await r.json();settings=a[0]?.valor||{};if(typeof settings==='string')settings=JSON.parse(settings);settingError='';}
  catch(e){settings={};settingError='No se pudo consultar la configuración comercial: '+e.message;}
 }
 function product(){const id=$('lafEditId')?.value||$('liftSeoProductId')?.textContent;return (typeof PRODUCTS!=='undefined'&&Array.isArray(PRODUCTS)?PRODUCTS:window.PRODUCTS||[]).find(p=>String(p.id)===String(id));}
 function clean(v){return String(v??'').trim();}
 function number(v){const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;}
 function build(){
  const p=product();if(!p)return null;
  const id=String(p.id), name=clean(p.name||p.nombre),brand=clean(p.brand||p.marca);
  const seo=window.liftSeoRead?.()||{};
  const obj={'@context':'https://schema.org','@type':'Product',name,sku:clean(p.sku||id)};
  const image=clean(seo.image||p.image||p.imagen);if(image)obj.image=[image];
  const desc=clean(seo.meta||p.description||p.descripcion);if(desc)obj.description=desc;
  if(brand)obj.brand={'@type':'Brand',name:brand};
  const presentation=clean(p.presentation||p.presentacion);if(presentation)obj.size=presentation;
  const flavor=clean(p.flavor||p.sabor);if(flavor)obj.additionalProperty=[{'@type':'PropertyValue',name:'Sabor',value:flavor}];
  const price=number(p.price??p.precio);
  const isOut=Boolean(p.agotado||p.outOfStock||p.disponible===false||p.stock===0||p.stock==='0');
  if(price!==null){const offer={'@type':'Offer',price,priceCurrency:'COP',availability:'https://schema.org/'+(isOut?'OutOfStock':'InStock'),itemCondition:'https://schema.org/NewCondition'};
   const sh=settings?.shipping;if(Array.isArray(sh)){const items=[];for(const v of sh){if(!v||!v.country||v.cost===undefined||number(v.cost)===null)continue;const d={'@type':'OfferShippingDetails',shippingRate:{'@type':'MonetaryAmount',value:number(v.cost),currency:v.currency||'COP'},shippingDestination:{'@type':'DefinedRegion',addressCountry:v.country}};if(v.region)d.shippingDestination.addressRegion=v.region;const dt={'@type':'ShippingDeliveryTime'};for(const [src,dst] of [['handling_days','handlingTime'],['transit_days','transitTime']])if(Array.isArray(v[src])&&v[src].length===2&&v[src].every(x=>Number.isInteger(x)&&x>=0))dt[dst]={'@type':'QuantitativeValue',minValue:v[src][0],maxValue:v[src][1],unitCode:'DAY'};if(Object.keys(dt).length>1)d.deliveryTime=dt;items.push(d);}if(items.length)offer.shippingDetails=items;}
   const ret=settings?.returns;if(ret?.country&&ret?.category){const pol={'@type':'MerchantReturnPolicy',applicableCountry:ret.country,returnPolicyCategory:ret.category};if(ret.category==='https://schema.org/MerchantReturnFiniteReturnWindow'&&Number.isInteger(ret.days)&&ret.days>=0)pol.merchantReturnDays=ret.days;if(ret.method)pol.returnMethod=ret.method;if(ret.fees)pol.returnFees=ret.fees;if(ret.category!=='https://schema.org/MerchantReturnFiniteReturnWindow'||pol.merchantReturnDays!==undefined)offer.hasMerchantReturnPolicy=pol;}
   obj.offers=offer;
  }
  return obj;
 }
 function render(){const pre=$('liftSchemaPreview'),sum=$('liftSchemaSummary');if(!pre)return;const obj=build();pre.textContent=obj?JSON.stringify(obj,null,2):'{}';if(sum)sum.textContent=obj?'Vista previa: '+obj.name+' · '+(obj.offers?'precio '+obj.offers.price+' COP':'sin precio')+' · '+(obj.offers?.availability?.split('/').pop()||'sin disponibilidad')+(settingError?' · '+settingError:''):'Selecciona un producto para ver su schema.';}
 function init(){if(!$('liftSchemaPreview'))return;$('liftSchemaRefresh')?.addEventListener('click',async()=>{await loadSettings();render()});$('liftSchemaCopy')?.addEventListener('click',async()=>{const data=$('liftSchemaPreview')?.textContent;if(data&&data!=='{}'){try{await navigator.clipboard.writeText(data);$('liftSchemaSummary').textContent='JSON-LD copiado';}catch(e){$('liftSchemaSummary').textContent='No se pudo copiar: '+e.message;}}});['liftSeoTitle','liftSeoMeta','liftSeoImage','lafPrice','lafName','lafBrand','lafPresentation'].forEach(id=>$(id)?.addEventListener('input',render));const original=window.liftSeoLoadForProduct;if(typeof original==='function')window.liftSeoLoadForProduct=async function(...args){const r=await original.apply(this,args);render();return r};loadSettings().then(render);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

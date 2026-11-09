(()=>{'use strict';
const ASSET_V='20261109-pv1';
/* Garantiza que el CSS cargado corresponda a esta versión del JS (evita tarjetas rotas por caché). */
(()=>{const links=[...document.querySelectorAll('link[rel="stylesheet"][href*="/paginas/supgo-pages.css"]')];if(links.some(l=>l.href.includes('v='+ASSET_V)))return;const l=document.createElement('link');l.rel='stylesheet';l.href='/paginas/supgo-pages.css?v='+ASSET_V;l.onload=()=>links.forEach(x=>x.remove());document.head.append(l)})();
const config={url:'https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_productos',key:'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh'};
const $=q=>document.querySelector(q),get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const state={rows:[],offers:get('supgoActiveOffersV1',{}),selectionIds:[],selected:new Set(),canCreate:false};async function loadOffers(){const u=new URL(config.url.replace('/lift_productos','/lift_catalog_config'));u.searchParams.set('select','valor');u.searchParams.set('clave','eq.weekly_offers');u.searchParams.set('limit','1');const res=await fetch(u,{headers:{apikey:config.key}});if(!res.ok)throw Error('Error al cargar ofertas');const data=await res.json();let offers=data[0]?.valor||{};if(typeof offers==='string')offers=JSON.parse(offers);state.offers=offers&&typeof offers==='object'&&!Array.isArray(offers)?offers:{};save('supgoActiveOffersV1',state.offers);}const pval=(p,...k)=>{for(const x of k)if(p?.[x]!==undefined&&p[x]!==null&&p[x]!=='')return p[x];return ''};
const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const HIDDEN_PUBLIC_BRANDS=new Set(['venom-pharma','lift-nutrientes']);
const isHiddenBrand=r=>HIDDEN_PUBLIC_BRANDS.has(slug(brand(r)));
const product=r=>r?.product||{},name=r=>String(pval(product(r),'name','nombre')||'Producto').replace(/\s*-\s*copia\s*$/i,'').replace(/\s*[-–|·]\s*$/,'').replace(/\s{2,}/g,' '),brand=r=>String(pval(product(r),'brand','marca')||''),category=r=>String(pval(product(r),'category','categoria')||''),price=r=>Number(pval(product(r),'price','precio')||0),image=r=>{let v=pval(product(r),'image','imagen','image_url','imagen_url','foto','url_imagen');if(!v&&Array.isArray(product(r).images))v=product(r).images[0];if(v&&typeof v==='object')v=v.url;return typeof v==='string'&&/^https?:\/\//.test(v)?v:''};
const secondaryImage=r=>{const p=product(r),first=image(r);const urls=[];const add=v=>{if(typeof v==='string'){const t=v.trim();if(t.startsWith('[')||t.startsWith('{')){try{add(JSON.parse(t));return}catch{}}if(/^https?:\/\//i.test(t))urls.push(t)}else if(Array.isArray(v))v.forEach(add);else if(v&&typeof v==='object'){const u=v.url||v.src||v.image_url||v.imagen_url||v.image||v.imagen;if(u)add(u)}};['images','imagenes','gallery','galeria','image_urls','imagenes_adicionales','secondary_image','image2','imagen2','image_2','imagen_2','foto2','foto_2','tabla_nutricional'].forEach(k=>add(p[k]));return urls.find(u=>u!==first&&!TABLA.test(u))||''};
/* Productos variables: cada sabor/tamaño vive dentro de la URL de su producto padre. */
const FAMS=new Map();const famOf=r=>FAMS.get(String(r&&r.id));
function setFamilias(list){FAMS.clear();(list||[]).forEach(f=>FAMS.set(String(f.producto_id),f))}
async function loadFamilias(){const u=new URL(config.url.replace('/lift_productos','/lift_familias_publicas'));u.searchParams.set('select','producto_id,grupo_id,slug,nombre,principal_id,tamano,sabor,orden');u.searchParams.set('limit','5000');const res=await fetch(u,{headers:{apikey:config.key}});if(!res.ok)throw Error('familias');const d=await res.json();state.extra=Object.assign(state.extra||{},{familias:d});setFamilias(d)}
const link=r=>{const f=famOf(r);if(f)return '/producto/'+f.slug+'/'+(String(f.principal_id)===String(r.id)?'':'?v='+r.id);return '/producto/'+r.slug+'/'};
/* Imágenes que son tabla nutricional / etiqueta: no se usan como foto de la tarjeta. */
const TABLA={test:u=>/tabla|facts|nutricional|etiqueta|ingredient|label/i.test(String(u).replace(/^https?:\/\/[^/]+/i,''))};
/* Tamaño y servicios a partir del nombre y la presentación (mismo criterio que la ficha). */
function datos(r){const t=name(r)+' '+String(pval(product(r),'presentation','presentacion')||''),o={};
 const w=t.match(/(\d+(?:[.,]\d+)?)\s*(lbs?|libras?|kg|kilos?|g|gr|grs|grm|gramos|ml|oz)\b/i);if(w){const u=w[2].toLowerCase();o.size=w[1].replace(',','.')+' '+(/^l/.test(u)?'lb':/^k/.test(u)?'kg':/^(g|gr|grs|grm|gramos)$/.test(u)?'g':u)}
 const sv=t.match(/(\d+)\s*(servicios|serv|srv|porciones|servings|scoops)\b/i);if(sv)o.serv=Number(sv[1]);
 const un=t.match(/(\d+)\s*(c[aá]psulas|caps?|capsules|tabletas|tabs?|tablets|softgels?|gomitas|gummies|sachets?|unidades|und|barras)\b/i);if(un)o.units=un[1]+' '+un[2].toLowerCase().replace(/^caps?$/,'cáps').replace(/^tabs?$/,'tabs');
 return o}
const perServing=r=>{const d=datos(r),{regular,sale,active}=offerOf(r),p=active?sale:regular;return d.serv>1&&p>0?p/d.serv:Infinity};
/* Familias de sabores: misma marca + nombre sin el sabor (equivalente a family_key de la ficha). */
function familyKey(r){const fm=famOf(r);if(fm)return 'g|'+fm.grupo_id;const p=product(r),b=slug(brand(r)),parent=String(pval(p,'parent_id','producto_padre_id','id_padre_sabor')||'').trim();if(parent)return 'p|'+b+'|'+parent;
 let n=slug(pval(p,'name','nombre'));const fl=slug(pval(p,'flavor','sabor'));if(fl){if(n.endsWith('-'+fl))n=n.slice(0,-(fl.length+1));else{const w=fl.split('-');for(let c=w.length-1;c>0;c--){const sh=w.slice(0,c).join('-');if(n.endsWith('-'+sh)){n=n.slice(0,-(sh.length+1));break}}}}
 return 'n|'+b+'|'+n}
function flavorLabel(r,fam){const fm=famOf(r);if(fm&&(fm.tamano||fm.sabor))return [fm.tamano,fm.sabor].filter(Boolean).join(' · ');const p=product(r);let l=String(pval(p,'flavor','sabor')||'').trim();if(l)return l;const words=fam.map(x=>name(x)+' '+String(x.slug||'').replace(/-/g,' '));
 /* Lo que no comparten los nombres/slugs de la familia es el sabor. */const toks=x=>slug(x).split('-').filter(Boolean);const all=words.map(toks),mine=toks(name(r)+' '+String(r.slug||'').replace(/-/g,' '));const common=all.reduce((a,t)=>a.filter(w=>t.includes(w)));const diff=[...new Set(mine.filter(w=>!common.includes(w)))];return diff.length&&diff.length<5?diff.map(w=>w[0].toUpperCase()+w.slice(1)).join(' '):name(r)}
function groupFamilies(rows){const m=new Map();for(const r of rows){const k=familyKey(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}
 /* Segunda pasada: productos sueltos que solo cambian en la última palabra (el sabor) y cuestan lo mismo. */
 const UNIT=/^(\d.*|lbs?|kg|g|gr|grs|grm|gramos|ml|oz|caps?|capsulas|tabs?|tabletas|softgels?|serv|servicios|srv|porciones|und|unidades|sachets?)$/;
 const loose=new Map();for(const [k,v] of m){if(v.length!==1)continue;const r=v[0],w=slug(name(r)).split('-');const last=w[w.length-1];if(w.length<3||UNIT.test(last))continue;const k2='s|'+slug(brand(r))+'|'+w.slice(0,-1).join('-')+'|'+price(r);if(!loose.has(k2))loose.set(k2,[]);loose.get(k2).push(k)}
 for(const keys of loose.values()){if(keys.length<2)continue;const fam=keys.flatMap(k=>m.get(k));keys.forEach(k=>m.delete(k));m.set(keys[0],fam)}
 return [...m.values()].map(fam=>{const pick=fam.slice().sort((a,b)=>{const A=offerOf(a),B=offerOf(b);return (B.active-A.active)||((A.active?A.sale:A.regular||Infinity)-(B.active?B.sale:B.regular||Infinity))})[0];return{r:pick,fam}})}
const filtros={grupo:'',talla:'',precio:''};
function cart(){const v=get('liftCartV2',{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function qty(v){return Number(typeof v==='object'?(v.quantity??v.qty):v)||0}
function change(id,d){const c=cart(),key=String(id);c[key]=Math.max(0,qty(c[key])+d);if(!c[key])delete c[key];save('liftCartV2',c);window.dispatchEvent(new Event('supgo-cart-change'));updateCount();}
function favorites(){
 const ids=get('liftFavoritesV1',[]),legacy=get('supgo_seo_favorites',[]);
 const f=new Set((Array.isArray(ids)?ids:[]).map(Number).filter(n=>Number.isInteger(n)&&n>0).map(String));
 if(Array.isArray(legacy))legacy.forEach(p=>{const n=Number(p&&p.id);if(Number.isInteger(n)&&n>0)f.add(String(n))});
 return f;
}
function toggleFav(id,btn){
 const f=favorites(),k=String(id),wasSelected=f.has(k);wasSelected?f.delete(k):f.add(k);
 try{
  save('liftFavoritesV1',[...f].map(Number));
  let legacy=get('supgo_seo_favorites',[]);
  if(Array.isArray(legacy)){legacy=legacy.filter(p=>String(p&&p.id)!==k);save('supgo_seo_favorites',legacy)}
 }catch(e){console.error('No se pudieron guardar favoritos',e);return}
 window.dispatchEvent(new Event('supgo-favorites-change'));
 if(btn&&page!=='favoritos'){paintFav(btn,id);btn.classList.remove('pop');void btn.offsetWidth;btn.classList.add('pop')}else render();
}
function updateCount(){const el=$('#cartcount');if(el)el.textContent=Object.values(cart()).reduce((a,v)=>a+qty(v),0)}
const CATALOG_CACHE='supgoCatalogV2Slug',CATALOG_TTL=20*60*1000;function readCatalogCache(){try{const c=JSON.parse(localStorage.getItem(CATALOG_CACHE)||'null');if(c&&Array.isArray(c.rows)&&Date.now()-c.t<CATALOG_TTL)return c}catch{}return null}function writeCatalogCache(){try{localStorage.setItem(CATALOG_CACHE,JSON.stringify({t:Date.now(),rows:state.rows,logos:[...labLogoMap],extra:state.extra||{}}))}catch{}}async function fetchCatalogPage(offset){const u=new URL(config.url);u.searchParams.set('select','id,product,activo,slug');u.searchParams.set('activo','eq.true');u.searchParams.set('order','id.asc');u.searchParams.set('limit','500');u.searchParams.set('offset',String(offset));const res=await fetch(u,{headers:{apikey:config.key}});if(!res.ok)throw Error('No se pudo cargar el catálogo ('+res.status+')');return res.json()}async function loadExtraImages(){const u=new URL(config.url.replace('/lift_productos','/lift_producto_imagenes'));u.searchParams.set('select','producto_id,imagen_url,orden');u.searchParams.set('order','orden.asc');u.searchParams.set('limit','5000');const res=await fetch(u,{headers:{apikey:config.key}});if(!res.ok)return;const out={};for(const x of await res.json()){const k=String(x.producto_id),v=String(x.imagen_url||'').trim();if(!out[k]&&/^https?:\/\//.test(v))out[k]=v}state.extra=out}
async function load(){/* 4 páginas en paralelo en lugar de una tras otra */const first=await Promise.all([0,500,1000,1500].map(fetchCatalogPage));const rows=first.flat();if(first[3].length===500){for(let offset=2000;offset<5000;offset+=500){const more=await fetchCatalogPage(offset);rows.push(...more);if(more.length<500)break}}state.rows=rows.filter(r=>!isHiddenBrand(r)&&isPublicRow(r))}
const labLogoMap=new Map();
async function loadLabLogos(){
  const u=new URL(config.url.replace('/lift_productos','/lift_catalog_config'));
  u.searchParams.set('select','valor');u.searchParams.set('clave','eq.laboratories_v1');u.searchParams.set('limit','1');
  const res=await fetch(u,{headers:{apikey:config.key}});
  if(!res.ok)return;
  const data=await res.json();let cfg=data[0]?.valor;
  if(typeof cfg==='string'){try{cfg=JSON.parse(cfg)}catch{return}}
  const items=Array.isArray(cfg)?cfg:Array.isArray(cfg?.laboratories)?cfg.laboratories:Array.isArray(cfg?.items)?cfg.items:cfg?.laboratories||cfg?.items||cfg;
  const valid=v=>{if(typeof v!=='string')return false;try{return ['http:','https:'].includes(new URL(v).protocol)}catch{return false}};
  const add=(name,obj)=>{if(!name)return;const url=typeof obj==='string'?obj:obj?.logo_url||obj?.logoUrl||obj?.logo||obj?.image_url||obj?.imageUrl||obj?.image||obj?.url;if(valid(url))labLogoMap.set(slug(name),url)};
  if(Array.isArray(items)){for(const x of items)add(x?.name||x?.nombre||x?.brand||x?.marca||x?.laboratorio,x)}
  else if(items&&typeof items==='object'){for(const [k,v]of Object.entries(items))add(v?.name||v?.nombre||k,v)}
}
const page=document.body.dataset.page,root=$('#content'),query=new URLSearchParams(location.search);
const SELECT_API='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-selecciones';
const selectionToken=page==='seleccion'?location.pathname.match(/^\/s\/([A-Za-z0-9_-]{12})\/?$/)?.[1]:null;
async function selectionApi(action,payload={}){
 const res=await fetch(SELECT_API,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});
 const body=await res.json().catch(()=>({}));if(!res.ok)throw Error(body.error||'No se pudo preparar la selección');
 return body;
}
async function loadSelection(){
 if(!selectionToken)throw Error('El enlace de selección no es válido.');
 const response=await selectionApi('get',{token:selectionToken});
 state.selectionIds=(Array.isArray(response.productos)?response.productos:[]).map(String);
}
function accountToken(){try{const x=JSON.parse(localStorage.getItem('supgoCuentaV1')||'null');return /^[0-9a-f]{64}$/.test(x?.token||'')?x.token:null}catch{return null}}
async function checkOwner(){if(page!=='favoritos'||sharedList())return;const token=accountToken();if(!token)return;try{state.canCreate=(await selectionApi('can-create',{session_token:token})).canCreate===true;if(state.canCreate)render()}catch(e){console.warn('Permisos de selección no disponibles')}}
function selectionChosenRows(){return state.rows.filter(r=>state.selected.has(String(r.id))&&state.selectionIds.includes(String(r.id)))}
function updateSelectionUi(){
 document.querySelectorAll('.select-check[data-id],.select-buy[data-id]').forEach(b=>{
  const selected=state.selected.has(String(b.dataset.id));
  b.classList.toggle('on',selected);b.setAttribute('aria-pressed',String(selected));
  b.textContent=b.classList.contains('select-check')?(selected?'✓':'○'):(selected?'✓ Seleccionado':'Seleccionar');
 });
 const btn=document.querySelector('#sendSelection');if(btn){btn.disabled=!state.selected.size;btn.textContent=state.selected.size?'Enviar mi selección por WhatsApp ('+state.selected.size+')':'Selecciona un producto para enviar'}
}
function toggleSelection(id){const key=String(id);state.selected.has(key)?state.selected.delete(key):state.selected.add(key);updateSelectionUi()}
function selectionBar(){
 const bar=document.createElement('div');bar.className='fav-bar selection-actions';
 const b=document.createElement('button');b.type='button';b.className='fav-act wa';b.id='sendSelection';
 b.onclick=()=>{const selected=selectionChosenRows();if(!selected.length)return;const message=selected.map(r=>name(r)+(brand(r)?' · '+brand(r):'')).join('\n');window.open('https://wa.me/573137380766?text='+encodeURIComponent(message),'_blank','noopener')};
 bar.append(b);root.prepend(bar);updateSelectionUi();
}
async function createSelection(rows,b){
 if(!rows.length){favToast('Agrega productos a tus favoritos primero');return}
 if(rows.length>25){favToast('Puedes enviar hasta 25 productos por selección');return}
 const session_token=accountToken();if(!session_token){favToast('Entra a tu cuenta para enviar selecciones');return}
 const tab=window.open('about:blank','_blank');
 b.disabled=true;try{
   const result=await selectionApi('create',{session_token,productos:rows.map(r=>Number(r.id))});
   const url=result.url;
   try{await copyText(url)}catch(e){}
   if(tab){tab.location.href='https://wa.me/?text='+encodeURIComponent(url)}
   else favToast('Enlace creado y copiado: '+url);
 }catch(e){if(tab)tab.close();favToast(e.message)}finally{b.disabled=false}
}
const isPublicRow=r=>{const p=product(r);return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r?.slug||'')&&r?.activo!==false&&!p.__deleted&&!p.__private&&!p.adminOnly&&!p.hidden&&!p.oculto&&p.visibility!=='admin'&&!!pval(p,'name','nombre')};
const flavorCount=r=>{const f=product(r).flavors;return Array.isArray(f)?f.filter(x=>String(x||'').trim()).length:0};
function offerOf(r){const offer=state.offers?.[String(r.id)],regular=price(r),sale=Number(offer?.price);const end=offer?.promoUntil?Date.parse(offer.promoUntil):NaN;const active=!!offer&&regular>0&&Number.isFinite(sale)&&sale>0&&sale<regular&&(!Number.isFinite(end)||Date.now()<=end);return{offer,regular,sale,active,end}}
function inCart(id){const c=cart(),k=String(id);return Object.entries(c).reduce((a,[key,v])=>a+(key.split('::')[0]===k?qty(v):0),0)}
const ICON_CART='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>';
const ICON_CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const ICON_HEART='<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
function paintBuy(btn,id){const n=inCart(id);btn.innerHTML=ICON_CART+'<span>Agregar</span>'+(n?'<em class="in-cart" aria-label="'+n+' en el carrito">'+n+'</em>':'');btn.setAttribute('aria-label','Agregar al carrito'+(n?' ('+n+' en el carrito)':''))}
function paintFav(btn,id){const on=favorites().has(String(id));btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',on?'true':'false');btn.setAttribute('aria-label',on?'Quitar de favoritos':'Guardar en favoritos');btn.title=on?'Quitar de favoritos':'Guardar en favoritos'}
function bumpCount(){const el=document.querySelector('#supgo-global-header #count')||$('#cartcount');if(!el)return;el.classList.remove('supgo-bump');void el.offsetWidth;el.classList.add('supgo-bump')}
const norm=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const SYN={proteina:['whey','isolate','iso'],whey:['proteina'],creatina:['creatine','crea'],creatine:['creatina'],preentreno:['pre','preworkout'],pre:['preentreno'],quemador:['fat','burner','lipo'],ganador:['gainer','mass','masa'],gainer:['ganador','masa'],masa:['mass','gainer'],vitamina:['vitamin','multivitaminico'],colageno:['collagen'],aminoacido:['bcaa','eaa','amino'],glutamina:['glutamine'],cafeina:['caffeine']};
const stem=w=>w.length>4&&w.endsWith('es')&&!w.endsWith('ces')?w.slice(0,-2):w.length>3&&w.endsWith('s')?w.slice(0,-1):w;
const toks=v=>norm(v).replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean).map(stem);
function scoreText(text,tokens,full){const n=norm(text),words=toks(text);let sc=0;for(const t of tokens){const alts=[t,...(SYN[t]||[]).map(stem)];let best=0;alts.forEach((a,i)=>{const w=i?0.7:1;if(words.includes(a))best=Math.max(best,3*w);else if(words.some(x=>x.startsWith(a)))best=Math.max(best,2*w);else if(a.length>=3&&n.includes(a))best=Math.max(best,w)});if(!best)return -1;sc+=best}if(n.startsWith(full))sc+=3;return sc}
function searchRows(rows,q){const tokens=toks(q),full=norm(q).trim();if(!tokens.length)return[];return rows.map(r=>{const a=scoreText(name(r)+' '+brand(r),tokens,full);const s=a>=0?a+1:scoreText(name(r)+' '+brand(r)+' '+category(r),tokens,full);return[r,s+(price(r)>0?0.5:0)]}).filter(x=>x[1]>=0).sort((a,b)=>b[1]-a[1]).map(x=>x[0])}
/* Celular: cuando la tarjeta está en pantalla alterna con la segunda foto; sin segunda foto, un acercamiento suave. */
const CAN_HOVER=matchMedia('(hover:hover) and (pointer:fine)').matches,REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;let photoIO=null;
function watchPhoto(photo){if(CAN_HOVER||REDUCE||!('IntersectionObserver' in window))return;photoIO=photoIO||new IntersectionObserver(es=>{for(const e of es){const p=e.target;if(e.isIntersecting&&e.intersectionRatio>=.6){p.classList.add('seen')}else{clearTimeout(p._d);clearInterval(p._t);p._t=0;p.classList.remove('flip')}}},{threshold:[0,.6]});photoIO.observe(photo)}
function card(r,fam){
const el=document.createElement('article');el.className='product';
const {offer,regular,sale,active,end}=offerOf(r),pct=active?Math.round((1-sale/regular)*100):0;
if(active)el.classList.add('on-offer');
const media=document.createElement('div');media.className='product-media';
const photo=document.createElement('a');photo.className='product-photo';photo.href=link(r);photo.tabIndex=-1;photo.setAttribute('aria-hidden','true');
if(image(r)){const img=document.createElement('img');img.className='primary-photo';img.src=image(r);img.alt=name(r);img.loading='lazy';img.decoding='async';img.width=300;img.height=300;img.onerror=()=>{img.remove();photo.classList.add('no-photo')};photo.append(img);const second=secondaryImage(r)||(state.extra||{})[String(r.id)];if(second&&second!==image(r)){photo.classList.add('has-second');const alternate=document.createElement('img');alternate.className='secondary-photo';alternate.src=second;alternate.alt='';alternate.loading='lazy';alternate.decoding='async';alternate.onerror=()=>alternate.remove();photo.append(alternate);const dots=document.createElement('span');dots.className='photo-dots';dots.innerHTML='<i></i><i></i>';photo.append(dots)}}else photo.classList.add('no-photo');watchPhoto(photo);
media.append(photo);
if(active&&pct>0){const badge=document.createElement('span');badge.className='badge-off';badge.textContent='-'+pct+'%';media.append(badge)}
else if(product(r).envio_gratis){const badge=document.createElement('span');badge.className='badge-off badge-ship';badge.textContent='Envío gratis';media.append(badge)}
const fav=document.createElement('button');fav.type='button';fav.className='fav';fav.dataset.id=String(r.id);
if(page==='seleccion'){fav.classList.add('select-check');fav.onclick=e=>{e.preventDefault();toggleSelection(r.id)}}
else{fav.innerHTML=ICON_HEART;paintFav(fav,r.id);fav.onclick=e=>{e.preventDefault();toggleFav(r.id,fav)}}
media.append(fav);
const info=document.createElement('div');info.className='product-details';
const lab=document.createElement('small');lab.className='brand';lab.textContent=brand(r)||' ';
const title=document.createElement('a');title.className='name';title.href=link(r);title.textContent=famOf(r)?famOf(r).nombre:name(r);title.title=title.textContent;
const amount=document.createElement('div');amount.className='price';
if(active){const now=document.createElement('strong');now.textContent=money(sale);const old=document.createElement('del');old.className='old-price';old.textContent=money(regular);old.setAttribute('aria-label','Antes '+money(regular));amount.append(now,old)}
else{const now=document.createElement('strong');now.textContent=regular>0?money(regular):'Consultar precio';if(!(regular>0))now.className='ask';amount.append(now)}
info.append(lab,title,amount);
/* Tamaño · servicios · precio por servicio */
{const d=datos(r),bits=[d.size,d.serv?d.serv+' serv.':'',d.units].filter(Boolean),ps=perServing(r);if(bits.length||ps<Infinity){const spec=document.createElement('div');spec.className='card-spec';spec.textContent=bits.join(' · ')+(ps<Infinity?(bits.length?' · ':'')+money(ps)+'/serv.':'');info.append(spec)}}
/* Sabores agrupados: una tarjeta con selector */
if(fam&&fam.length>1){const prices=fam.map(x=>{const o=offerOf(x);return o.active?o.sale:o.regular}).filter(n=>n>0),min=Math.min(...prices);
 if(prices.length&&min<Math.max(...prices)){const from=document.createElement('small');from.className='desde';from.textContent='Desde '+money(min);info.append(from)}
 const sel=document.createElement('select');sel.className='sabor-select';sel.setAttribute('aria-label','Sabor de '+name(r));
 fam.forEach(x=>{const o=new Option(flavorLabel(x,fam),String(x.id));if(String(x.id)===String(r.id))o.selected=true;sel.add(o)});
 sel.onchange=()=>{const nx=fam.find(x=>String(x.id)===sel.value);if(nx)el.replaceWith(card(nx,fam))};
 const wrap=document.createElement('label');wrap.className='sabores';const tx=document.createElement('span');tx.textContent=fam.length+(fam.some(x=>famOf(x)&&famOf(x).tamano)?' opciones':' sabores');wrap.append(tx,sel);info.append(wrap)}
const meta=document.createElement('div');meta.className='card-meta';
if(active){const original=Number(offer.originalPrice),base=Number.isFinite(original)&&original>sale?original:regular,savings=Math.max(0,base-sale);if(savings>0){const saving=document.createElement('span');saving.className='saving';saving.textContent='Ahorras '+money(savings);meta.append(saving)}}
const nf=flavorCount(r);if(nf>1&&!(fam&&fam.length>1)){const fl=document.createElement('span');fl.className='flavors';fl.textContent=nf+' sabores';meta.append(fl)}
if(meta.childNodes.length)info.append(meta);
if(active&&page==='ofertas'){
 const details=document.createElement('div');details.className='offer-card-extras';
 if(Number.isFinite(end)){const date=document.createElement('span');date.className='offer-card-date';date.textContent='Hasta el '+new Intl.DateTimeFormat('es-CO',{day:'numeric',month:'short',timeZone:'America/Bogota'}).format(new Date(end));details.append(date)}
 if(offer.gift){const giftProduct=state.rows.find(p=>String(p.id)===String(offer.giftProductId));const giftName=String(offer.giftName||(giftProduct?name(giftProduct):'')).trim();if(giftName){const gift=document.createElement('div');gift.className='offer-card-gift';if(giftProduct&&image(giftProduct)){const img=document.createElement('img');img.src=image(giftProduct);img.alt='';img.loading='lazy';gift.append(img)}const label=document.createElement('span');const qtyGift=Math.max(1,Number(offer.giftQty)||1);label.textContent='🎁 Regalo: '+(qtyGift>1?qtyGift+' × ':'')+giftName;gift.append(label);details.append(gift)}}
 if(details.childNodes.length)info.append(details);
}
const actions=document.createElement('div');actions.className='actions';
if(page==='seleccion'){
 const choose=document.createElement('button');choose.type='button';choose.className='buy select-buy';choose.dataset.id=String(r.id);choose.onclick=()=>toggleSelection(r.id);
 const details=document.createElement('a');details.className='select-details';details.href=link(r);details.textContent='Ver ficha completa';details.target='_blank';details.rel='noopener';
 actions.append(choose,details);
 photo.target='_blank';photo.rel='noopener';title.target='_blank';title.rel='noopener';
}else if(regular>0||active){
 const buy=document.createElement('button');buy.type='button';buy.className='buy';buy.dataset.id=String(r.id);paintBuy(buy,r.id);let timer=0;
 buy.onclick=()=>{const key=String(r.id),m=get('liftCartMetaV1',{});m[key]={...(m[key]||{}),name:name(r),image:image(r),price:active?sale:regular,on_offer:active,promoUntil:active?(offer.promoUntil||null):null};save('liftCartMetaV1',m);change(r.id,1);bumpCount();clearTimeout(timer);buy.classList.add('added');buy.innerHTML=ICON_CHECK+'<span>Agregado</span>';buy.setAttribute('aria-label','Agregado al carrito');timer=setTimeout(()=>{buy.classList.remove('added');paintBuy(buy,r.id)},1400)};
 actions.append(buy);
}else{const ask=document.createElement('a');ask.className='buy ask-btn';ask.href='https://wa.me/573137380766?text='+encodeURIComponent('Hola, quiero saber el precio de '+name(r));ask.target='_blank';ask.rel='noopener';ask.textContent='Consultar';actions.append(ask)}
info.append(actions);el.append(media,info);return el;
}

/* Listas de favoritos compartibles: /favoritos/?lista=ID,ID,ID (solo números de producto). */
function sharedList(){const raw=query.get('lista');if(!raw)return null;const ids=[...new Set(raw.split(/[,\s]+/).map(x=>x.replace(/\D/g,'')).filter(Boolean))].slice(0,60);return ids.length?ids:null}
function favToast(msg){let t=$('#favToast');if(!t){t=document.createElement('div');t.id='favToast';t.className='fav-toast';t.setAttribute('role','status');document.body.append(t)}t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600)}
async function copyText(v){try{await navigator.clipboard.writeText(v);return true}catch{const a=document.createElement('textarea');a.value=v;a.style.cssText='position:fixed;opacity:0';document.body.append(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch{}a.remove();return ok}}
function addAllToCart(rows){const m=get('liftCartMetaV1',{});let n=0;for(const r of rows){const {regular,sale,active,offer}=offerOf(r);if(!(regular>0||active))continue;const key=String(r.id);m[key]={...(m[key]||{}),name:name(r),image:image(r),price:active?sale:regular,on_offer:active,promoUntil:active?(offer.promoUntil||null):null};const c=cart();c[key]=qty(c[key])+1;save('liftCartV2',c);n++}save('liftCartMetaV1',m);window.dispatchEvent(new Event('supgo-cart-change'));updateCount();return n}
function favBar(rows,shared){
 document.querySelector('.fav-bar')?.remove();
 const notice=document.querySelector('main .notice'),h1=$('h1');
 if(shared){if(h1)h1.textContent='Lista compartida';const sub=document.querySelector('main .muted');if(sub)sub.textContent='Productos seleccionados en SUPGO.';if(notice)notice.textContent='Alguien compartió esta selección de productos contigo. Los precios son los actuales de la tienda.';document.title='Lista compartida | SUPGO'}
 if(!rows.length){if(shared)root.innerHTML='<p class="empty">Los productos de esta lista ya no están disponibles. <a href="/">Ver la tienda</a></p>';return}
 const bar=document.createElement('div');bar.className='fav-bar';
 const mk=(label,cls,fn)=>{const b=document.createElement('button');b.type='button';b.className='fav-act '+cls;b.innerHTML=label;b.onclick=()=>fn(b);bar.append(b);return b};
 if(shared){
  const mine=favorites(),missing=rows.filter(r=>!mine.has(String(r.id)));
  mk('🛒 Agregar todo al carrito','dark',()=>{const n=addAllToCart(rows);favToast(n?(n===1?'Se agregó 1 producto al carrito':'Se agregaron '+n+' productos al carrito'):'Estos productos se consultan por WhatsApp')});
  mk(missing.length?'♡ Guardar en mis favoritos':'✓ Ya están en tus favoritos','',b=>{const f=favorites();rows.forEach(r=>f.add(String(r.id)));save('liftFavoritesV1',[...f].map(Number));render();favToast('Guardados en tus favoritos')});
  const own=document.createElement('a');own.className='fav-link';own.href='/favoritos/';own.textContent='Ver mis favoritos';bar.append(own);
 }else{
  mk('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8 15.8 6.3M8.2 13.2l7.6 4.5"/></svg> Compartir mi lista','dark',async()=>{
   const url='https://supgo.co/favoritos/?lista='+rows.map(r=>r.id).join(','),text='Mira mi lista de favoritos en SUPGO ('+rows.length+(rows.length===1?' producto':' productos')+'):';
   if(navigator.share){try{await navigator.share({title:'Mis favoritos en SUPGO',text,url});return}catch(e){if(e&&e.name==='AbortError')return}}
   favToast(await copyText(url)?'Enlace copiado. Pégalo en WhatsApp o donde quieras.':url);
  });
  const wa=document.createElement('a');wa.className='fav-act wa';wa.target='_blank';wa.rel='noopener';wa.href='https://wa.me/?text='+encodeURIComponent('Mira mi lista de favoritos en SUPGO: https://supgo.co/favoritos/?lista='+rows.map(r=>r.id).join(','));wa.textContent='Enviar por WhatsApp';bar.append(wa);
  if(state.canCreate)mk('☑ Enviar selección','',b=>createSelection(rows,b));
 }
 root.prepend(bar);
}
function grid(rows,groups){root.replaceChildren();if(!rows.length&&!(groups&&groups.length)){root.innerHTML='<p class="empty">No hay productos para mostrar.</p>';return}const el=document.createElement('div');el.className='grid';if(groups)groups.forEach(g=>el.append(card(g.r,g.fam)));else rows.forEach(r=>el.append(card(r)));root.append(el)}
function renderCart(){const c=cart(),entries=Object.entries(c).filter(([id,v])=>qty(v)>0);root.replaceChildren();if(!entries.length){root.innerHTML='<p class="empty">Tu carrito está vacío.</p>';return}let total=0,missing=false;for(const [key,v]of entries){const id=key.split('::')[0],r=state.rows.find(x=>String(x.id)===id),q=qty(v),regular=r?price(r):0,offer=state.offers?.[id],sale=Number(offer?.price),expiry=offer?.promoUntil?Date.parse(offer.promoUntil):NaN,offerActive=regular>0&&Number.isFinite(sale)&&sale>0&&sale<regular&&(!Number.isFinite(expiry)||Date.now()<=expiry),fallback=get('liftCartMetaV1',{})[key]||{},fallbackSale=Number(fallback.price),fallbackExpiry=fallback.promoUntil?Date.parse(fallback.promoUntil):NaN,fallbackOffer=fallback.on_offer===true&&Number.isFinite(fallbackSale)&&fallbackSale>0&&regular>fallbackSale&&(!Number.isFinite(fallbackExpiry)||Date.now()<=fallbackExpiry),cost=offerActive?sale:(fallbackOffer?fallbackSale:(regular||fallbackSale||0));if(!cost)missing=true;total+=cost*q;const row=document.createElement('div');row.className='cartrow';const img=document.createElement('img');if(r&&image(r))img.src=image(r);img.alt='';const label=document.createElement('div');label.className='name';label.textContent=r?name(r):'Producto '+id;const amount=document.createElement('strong');amount.textContent=cost?money(cost*q):'Consultar precio';const controls=document.createElement('div');controls.className='qty';const minus=document.createElement('button');minus.textContent='−';minus.setAttribute('aria-label','Reducir cantidad');minus.onclick=()=>{change(key,-1);renderCart()};const number=document.createElement('span');number.textContent=String(q);const plus=document.createElement('button');plus.textContent='+';plus.setAttribute('aria-label','Aumentar cantidad');plus.onclick=()=>{change(key,1);renderCart()};controls.append(minus,number,plus);const del=document.createElement('button');del.className='btn alt remove';del.textContent='Quitar';del.onclick=()=>{const current=cart();delete current[key];save('liftCartV2',current);window.dispatchEvent(new Event('supgo-cart-change'));updateCount();renderCart()};row.append(img,label,amount,controls,del);root.append(row)}const summary=document.createElement('div');summary.className='summary';summary.innerHTML='<span>Subtotal</span><strong>'+money(total)+'</strong>';const foot=document.createElement('p');foot.className='notice';foot.textContent=missing?'Hay productos sin precio confirmado. El checkout verificará los valores.':'El total definitivo y el envío se verifican al continuar.';const go=document.createElement('a');go.href='/checkout/';go.className='btn';go.textContent='Continuar pedido';root.append(summary,foot,go)}
const PRECIOS=[['','Todos los precios'],['0-100000','Hasta $100.000'],['100000-200000','$100.000 a $200.000'],['200000-300000','$200.000 a $300.000'],['300000-','Más de $300.000']];
function buildFilters(rows){const box=$('#filtros');if(!box||box.dataset.ready)return;if(rows.length<6)return;box.dataset.ready='1';
 const grupo=page==='categoria'?brand:category,gl=page==='categoria'?'Marca':'Categoría';
 const count=(arr,fn)=>{const m=new Map();arr.forEach(r=>{const v=fn(r);if(v)m.set(v,(m.get(v)||0)+1)});return [...m].sort((a,b)=>a[0].localeCompare(b[0],'es'))};
 const mk=(id,label,opts,key)=>{if(opts.length<3)return;const s=document.createElement('select');s.id=id;s.setAttribute('aria-label',label);opts.forEach(([v,t])=>s.add(new Option(t,v)));s.onchange=()=>{filtros[key]=s.value;render()};box.append(s)};
 mk('f-grupo',gl,[['','Todas: '+gl.toLowerCase()],...count(rows,grupo).map(([v,n])=>[v,v+' ('+n+')'])],'grupo');
 mk('f-talla','Tamaño',[['','Todos los tamaños'],...count(rows,r=>datos(r).size).sort((a,b)=>parseFloat(a[0])-parseFloat(b[0])).map(([v,n])=>[v,v+' ('+n+')'])],'talla');
 mk('f-precio','Precio',PRECIOS,'precio');
 if(box.childNodes.length){box.hidden=false;const clear=document.createElement('button');clear.type='button';clear.className='f-clear';clear.textContent='Limpiar';clear.onclick=()=>{Object.keys(filtros).forEach(k=>filtros[k]='');box.querySelectorAll('select').forEach(s=>s.value='');render()};box.append(clear)}}
function applyFilters(rows){const grupo=page==='categoria'?brand:category;return rows.filter(r=>{if(filtros.grupo&&grupo(r)!==filtros.grupo)return false;if(filtros.talla&&datos(r).size!==filtros.talla)return false;if(filtros.precio){const [a,b]=filtros.precio.split('-').map(x=>x===''?Infinity:Number(x)),o=offerOf(r),p=o.active?o.sale:o.regular;if(!(p>0))return false;if(p<(a===Infinity?0:a)||(b!==Infinity&&p>=b))return false}return true})}
function render(){updateCount();if(page==='carrito'){renderCart();return}if(page==='categorias'||page==='laboratorios'){const mode=page==='categorias'?'category':'brand';const values=[...new Set(state.rows.map(r=>mode==='category'?category(r):brand(r)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));root.replaceChildren();const list=document.createElement('div');list.className='links';for(const v of values){const a=document.createElement('a');a.href='/'+page+'/'+slug(v)+'/';a.textContent=v;if(page==='laboratorios'){a.classList.add('labLogoCard');const alias={'basic-supplements':'basic','insane-labz':'insane','insane-labz-':'insane','optimum-nutrition':'on','hi-tech-pharmaceuticals':'hitech'};const logo=labLogoMap.get(slug(v))||labLogoMap.get(alias[slug(v)]||'');if(logo){const im=document.createElement('img');im.className='labLogo';im.src=logo;im.alt='Logo de '+v;im.loading='lazy';im.decoding='async';im.onerror=()=>im.remove();a.prepend(im)}const view=document.createElement('span');view.className='labViewButton';view.textContent='Ver productos →';a.append(view)}const small=document.createElement('small');small.textContent=state.rows.filter(r=>(mode==='category'?category(r):brand(r))===v).length+' productos';a.append(small);list.append(a)}root.append(list);return}
let rows=state.rows;if(page==='ofertas'){rows=state.rows.filter(r=>{const o=state.offers?.[String(r.id)];if(!o||typeof o!=='object')return false;const regular=price(r),sale=Number(o.price);if(!Number.isFinite(sale)||sale<=0||sale>=regular)return false;if(o.promoUntil){const expiry=Date.parse(o.promoUntil);if(Number.isFinite(expiry)&&Date.now()>expiry)return false;}return true;});}const sharedIds=page==='favoritos'?sharedList():null;if(page==='favoritos')rows=sharedIds?sharedIds.map(id=>rows.find(r=>String(r.id)===id)).filter(Boolean):rows.filter(r=>favorites().has(String(r.id)));
if(page==='seleccion')rows=state.selectionIds.map(id=>rows.find(r=>String(r.id)===id)).filter(Boolean);if(page==='buscar'){const q=query.get('q')||'';rows=q?searchRows(rows,q):[];const h=$('h1');if(h&&q)h.textContent=rows.length+' resultado'+(rows.length===1?'':'s')+' para “'+q+'”';const input=$('#searchterm');if(input)input.value=query.get('q')||''}
if(page==='categoria'||page==='laboratorio'){const segment=document.body.dataset.slug||location.pathname.split('/').filter(Boolean).pop(),key=page==='categoria'?category:brand;rows=rows.filter(r=>slug(key(r))===segment);const heading=$('h1');if(page==='laboratorio'&&heading){const labName=rows.length?key(rows[0]):heading.textContent.trim();const logo=labLogoMap.get(slug(labName));let imageNode=document.querySelector('.supgo-lab-heading-logo');if(logo&&!imageNode){imageNode=document.createElement('img');imageNode.className='supgo-lab-heading-logo';imageNode.src=logo;imageNode.alt='Logo de '+labName;imageNode.loading='eager';imageNode.decoding='async';imageNode.onerror=()=>imageNode.remove();heading.parentNode.insertBefore(imageNode,heading)}else if(imageNode&&logo&&imageNode.src!==logo){imageNode.src=logo}}}
const coleccion=page==='categoria'||page==='laboratorio';if(coleccion){buildFilters(rows);rows=applyFilters(rows)}
const eff=r=>{const o=offerOf(r);return o.active?o.sale:(o.regular||Infinity)};
const sort=$('#sort');let groups=coleccion?groupFamilies(rows):null;const sorter=sort?.value==='asc'?(a,b)=>eff(a)-eff(b):sort?.value==='desc'?(a,b)=>(eff(b)===Infinity?0:eff(b))-(eff(a)===Infinity?0:eff(a)):sort?.value==='serv'?(a,b)=>perServing(a)-perServing(b):sort?.value==='za'?(a,b)=>name(b).localeCompare(name(a),'es',{sensitivity:'base'}):sort?.value==='az'?(a,b)=>name(a).localeCompare(name(b),'es',{sensitivity:'base'}):null;
if(sorter){rows.sort(sorter);if(groups)groups.sort((x,y)=>sorter(x.r,y.r))}
if(coleccion){const c=$('#conteo');if(c){const n=groups.length;c.textContent=n+(n===1?' producto':' productos')+(rows.length>n?' · '+rows.length+' presentaciones':'')}}
grid(rows,groups);if(page==='favoritos')favBar(rows,!!sharedIds);if(page==='seleccion'){selectionBar();updateSelectionUi()}}
async function boot(){const sort=$('#sort');if(sort&&!sort.querySelector('option[value="az"]')){const az=new Option('Nombre: A-Z','az');const za=new Option('Nombre: Z-A','za');sort.add(az,sort.options[1]||null);sort.add(za,sort.options[2]||null)}updateCount();if(['checkout','mis-pedidos'].includes(page))return;const cached=readCatalogCache();if(cached){state.rows=cached.rows.filter(r=>!isHiddenBrand(r)&&isPublicRow(r));for(const [k,v] of cached.logos||[])labLogoMap.set(k,v);state.extra=cached.extra||{};setFamilias(state.extra.familias);if(page!=='seleccion')try{render()}catch(e){console.warn(e)}}try{const tasks=[load(),loadFamilias().catch(e=>console.warn('Familias no disponibles',e)),loadExtraImages().catch(()=>{}),loadOffers().catch(error=>console.warn('Usando ofertas en caché local',error))];if(page==='seleccion')tasks.push(loadSelection());if(page==='laboratorios'||page==='laboratorio')tasks.push(loadLabLogos().catch(e=>console.warn('Logos no disponibles',e)));await Promise.all(tasks);writeCatalogCache();render();if(page==='favoritos')checkOwner()}catch(e){if(page==='seleccion'||!cached)root.textContent=e.message}}
/* Las páginas estáticas de marca/categoría conservan un topbar antiguo.
   Sustituirlo por el mismo header global que usan Home y ofertas. */
document.addEventListener('DOMContentLoaded',()=>{
  const legacy=document.querySelector('body[data-page="laboratorio"] > header.topbar,body[data-page="categoria"] > header.topbar');
  if(!legacy)return;
  legacy.remove();
  if(document.querySelector('script[src*="/componentes/header-loader.js"]'))return;
  const loader=document.createElement('script');
  loader.src='/componentes/header-loader.js?v=20261022-lab-shared';
  loader.onerror=()=>console.error('No se pudo cargar el header compartido');
  document.body.appendChild(loader);
});
document.addEventListener('DOMContentLoaded',boot);
const repaintBuys=()=>document.querySelectorAll('.grid .buy[data-id]:not(.added)').forEach(b=>paintBuy(b,b.dataset.id));window.addEventListener('supgo-cart-change',repaintBuys);window.addEventListener('storage',e=>{if(e.key==='liftCartV2'){repaintBuys();updateCount()}});
window.addEventListener('supgo-favorites-change',()=>{
 document.querySelectorAll('.grid .fav[data-id]').forEach(b=>paintFav(b,b.dataset.id));
});
window.supgoPages={render,change};
})();
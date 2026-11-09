/* SUPGO · Productos variables (como WooCommerce).
   Un producto padre con una sola URL y sus variaciones de tamaño y sabor.
   Cada variación sigue siendo un producto del catálogo (mismo ID para carrito, pedidos y ofertas). */
(function(){
'use strict';
const SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1',DISMISS='supgoVarDescartadasV1';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const slugify=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CO');
const yes=v=>v===true||v==='true'||v===1||v==='1';
const pw=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
const ls=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}};
const S={prods:new Map(),groups:[],offers:{},sugs:[],sel:new Set(),dismissed:new Set(ls(DISMISS)||[]),shown:0,E:null,dirty:false};

/* ---------- Datos ---------- */
async function rpc(action,payload){
  const r=await fetch(SB+'/rest/v1/rpc/lift_variables_admin',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify({p_password:pw(),p_action:action,p_payload:payload||{}})});
  const j=await r.json().catch(()=>null);
  if(!r.ok){const m=(j&&j.message)||'Error '+r.status;if(/Clave incorrecta/.test(m))lock('La clave no es válida');throw new Error(m)}
  return j;
}
async function rest(path,range){const h={apikey:KEY,Authorization:'Bearer '+KEY};if(range)h.Range=range;const r=await fetch(SB+'/rest/v1/'+path,{headers:h});if(!r.ok)throw new Error('Supabase '+r.status);return r.json()}
async function loadProducts(){let out=[],from=0;for(;;){const b=await rest('lift_productos?select=id,slug,activo,product&activo=eq.true&order=id',from+'-'+(from+999));out=out.concat(b);if(b.length<1000)break;from+=1000}return out}
function sync(s,t){const el=$('sync');el.className='sync '+s;el.querySelector('span').textContent=t}
async function load(){
  sync('load','Cargando catálogo…');
  try{
    const [rows,g,off]=await Promise.all([loadProducts(),rpc('list'),rest('lift_catalog_config?select=valor&clave=eq.weekly_offers&limit=1').catch(()=>[])]);
    S.prods=new Map(rows.filter(pub).map(r=>[String(r.id),r]));
    S.groups=g.grupos||[];
    let o=off[0]&&off[0].valor||{};if(typeof o==='string'){try{o=JSON.parse(o)}catch(e){o={}}}S.offers=o||{};
    buildVocab();suggest();fillLists();
    sync('ok',S.prods.size+' productos · '+published().length+' variables');
    render();
  }catch(e){sync('err','Error');if(!/Clave/.test(e.message))toast(e.message,'err')}
}
function pub(r){const p=r.product||{};return r.activo!==false&&(p.name||p.nombre)&&!yes(p.__deleted)&&!yes(p.__private)&&!yes(p.adminOnly)&&!yes(p.hidden)&&!yes(p.oculto)&&p.visibility!=='admin'&&!/\s-\s*copia\s*$/i.test(p.name||'')}
const P=id=>S.prods.get(String(id));
const pname=r=>String((r&&r.product&&(r.product.name||r.product.nombre))||'Producto #'+(r&&r.id));
const pimg=r=>{const u=String((r&&r.product&&(r.product.image||r.product.imagen))||'');return /^https?:\/\//.test(u)?u:''};
const pprice=r=>Number(r&&r.product&&r.product.price)||0;
const offerOf=id=>{const o=S.offers[String(id)],r=P(id);if(!o||!r)return 0;const s=Number(o.price);if(!(s>0&&s<pprice(r)))return 0;if(o.promoUntil&&Date.now()>Date.parse(o.promoUntil))return 0;return s};
const published=()=>S.groups.filter(g=>g.slug);
const memberOf=()=>{const m=new Map();S.groups.forEach(g=>(g.variantes||[]).forEach(v=>m.set(String(v.producto_id),g)));return m};

/* ---------- Detección de tamaño y sabor ---------- */
const UNIT='lbs?|libras?|kg|kilos?|g|gr|grs|gramos|oz|onzas|ml|serv|servs|servicios?|servings?|srv|caps|capsulas?|cápsulas?|vcaps|tabs|tabletas?|softgels?|unidades|und|unds|sobres?|porciones|gomitas|gummies';
const SIZE_RE=new RegExp('(\\d+(?:[.,]\\d+)?)\\s*('+UNIT+')(?![a-z])','gi');
function unitOf(u){u=norm(u);return /^(lbs?|libras?)$/.test(u)?'lb':/^(kg|kilos?)$/.test(u)?'kg':/^(g|gr|grs|gramos)$/.test(u)?'g':/^(oz|onzas)$/.test(u)?'oz':u==='ml'?'ml':/^(serv|servs|servicios?|servings?|srv|porciones)$/.test(u)?'serv':/^(caps|capsulas?|vcaps)$/.test(u)?'caps':/^(tabs|tabletas?)$/.test(u)?'tabs':/^softgels?$/.test(u)?'softgels':/^(und|unds|unidades)$/.test(u)?'und':u}
function sizesIn(text){const out=[];String(text||'').replace(SIZE_RE,(m,n,u)=>{out.push(n.replace(',','.')+' '+unitOf(u));return m});return out}
const BASE_FL='vainilla chocolate fresa cookies cookie cream crema mani mantequilla banano banana cafe capuchino moca mocha coco limon naranja uva mango maracuya pina sandia cereza frutos rojos tropical toronja manzana menta caramelo brownie dona donut cake pebbles cocoa birthday pistacho chicle algodon azucar blue raspberry frambuesa mora lychee lichi kiwi melon durazno guayaba lulo arandano sabor natural original fruit punch ponche watermelon lemon lime orange grape strawberry vanilla peanut butter cinnamon canela galleta galletas blanco white rainbow candy sour gummy tamarindo cola pink lemonade limonada mojito pera icy acai mantequilla glazed latte ice'.split(' ');
let FL=new Set(BASE_FL);
function buildVocab(){
  const c=new Map();
  S.prods.forEach(r=>{const f=r.product&&r.product.flavor;if(f)norm(f).split(/[^a-z0-9]+/).forEach(t=>{if(t.length>2&&!/^\d/.test(t))c.set(t,(c.get(t)||0)+1)})});
  S.groups.forEach(g=>(g.variantes||[]).forEach(v=>norm(v.sabor).split(/[^a-z0-9]+/).forEach(t=>{if(t.length>2&&!/^\d/.test(t))c.set(t,(c.get(t)||0)+1)})));
  // Palabras de tipo de producto que a veces vienen en el campo sabor: nunca son sabor.
  const NO='whey iso isolate isolated protein proteina mass gainer creatina creatine bar barra pre workout amino aminos bcaa eaa beef gold standard nitro tech elite pure best hydro hydrolyzed caseina casein vegan collagen colageno gel shot lata'.split(' ');
  FL=new Set(BASE_FL);c.forEach((n,t)=>{if(n>=2)FL.add(t)});NO.forEach(w=>FL.delete(w));
}
const STOP=new Set(['de','y','con','sabor','sabores','x','and','the','by']);
/* Separa un nombre en: base (para agrupar), tamaño y sabor. */
function parse(r,hint){
  const p=r.product||{},name=pname(r),pres=String(p.presentation||p.presentacion||'');
  const sizes=sizesIn(name),peso=sizes.filter(x=>/ (lb|kg|g|oz|ml)$/.test(x)),pz=sizesIn(pres);const tam=peso[0]||sizes[0]||(hint&&hint.tamano)||pz[0]||(pres&&pres.length<24&&!/[a-z]{4,}\s+[a-z]{4,}/i.test(pres)?pres:'');
  const rest=name.replace(SIZE_RE,' ').replace(/[()|/\-–,+%]+/g,' ');
  const ownFl=new Set(norm((p.flavor||'')+' '+((hint&&hint.sabor)||'')).split(/[^a-z0-9]+/).filter(w=>w&&!/^\d/.test(w)));
  const words=rest.split(/\s+/).filter(Boolean);
  // El sabor va al final del nombre: se toman las palabras de sabor del final hacia atrás.
  const W=words.map(w=>({w,n:norm(w).replace(/[^a-z0-9]/g,'')})).filter(x=>x.n);
  let i=W.length-1;const flav=[];
  while(i>0&&(FL.has(W[i].n)||ownFl.has(W[i].n)||STOP.has(W[i].n))){if(!STOP.has(W[i].n))flav.unshift(W[i].w);i--}
  const core=W.slice(0,i+1).filter(x=>!STOP.has(x.n)&&!ownFl.has(x.n)).map(x=>x.w);
  let sab=(hint&&hint.sabor)||flav.join(' ')||String(p.flavor||'').trim();
  sab=sab?sab.toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase()):'';
  return {core:core.join(' '),key:core.map(w=>norm(w).replace(/[^a-z0-9]/g,'')).filter(Boolean).join('-'),tamano:tam,sabor:sab};
}

/* ---------- Sugerencias ---------- */
function suggest(){
  const inPub=new Set();published().forEach(g=>(g.variantes||[]).forEach(v=>inPub.add(String(v.producto_id))));
  // Grupos viejos (sin URL): su sabor y tamaño ayudan a separar mejor. El sabor a veces repite el nombre: se limpia.
  const hints=new Map();S.groups.filter(g=>!g.slug).forEach(g=>{const gw=new Set(norm(g.nombre).split(/[^a-z0-9]+/));(g.variantes||[]).forEach(v=>{
    let sab=String(v.sabor||'').split(/\s+/).filter(w=>!gw.has(norm(w).replace(/[^a-z0-9]/g,''))).join(' ').trim()||String(v.sabor||'').trim();
    if(/^(variación|variacion)\s*\d+$/i.test(sab))sab='';
    if(sizesIn(sab).length||sab.length>32)sab='';
    hints.set(String(v.producto_id),{sabor:sab,tamano:v.tamano||sizesIn(g.presentacion+' '+g.nombre)[0]||''})})});
  const fam=new Map();
  S.prods.forEach((r,id)=>{
    if(inPub.has(id))return;
    const h=hints.get(id),x=parse(r,h),brand=String(r.product.brand||r.product.marca||'').trim();
    if(!x.key)return;
    const k=slugify(brand)+'|'+x.key;
    if(!fam.has(k))fam.set(k,{brand,cats:{},items:[]});
    const f=fam.get(k);f.items.push({id,tamano:x.tamano,sabor:x.sabor,core:x.core});const c=r.product.category||'';f.cats[c]=(f.cats[c]||0)+1;
  });
  const used=new Set(S.groups.filter(g=>g.slug).map(g=>g.slug));
  S.sugs=[];
  fam.forEach((f,k)=>{
    if(f.items.length<2||S.dismissed.has(k))return;
    f.items.sort((a,b)=>sortSize(a.tamano)-sortSize(b.tamano)||a.sabor.localeCompare(b.sabor,'es'));
    const core=f.items.map(i=>i.core).sort((a,b)=>a.length-b.length)[0]||'';
    const bw=norm(f.brand).split(/[^a-z0-9]+/).filter(w=>w.length>2),cw=new Set(norm(core).split(/[^a-z0-9]+/));
    const nombre=(core+(f.brand&&!bw.some(w=>cw.has(w))&&!/varias marcas/i.test(f.brand)?' '+f.brand:'')).replace(/\s{2,}/g,' ').trim();
    let slug=slugify(nombre);const ids=new Set(f.items.map(i=>i.id));
    const taken=s=>used.has(s)||[...S.prods.values()].some(r=>r.slug===s&&!ids.has(String(r.id)));
    if(taken(slug)){let n=2;while(taken(slug+'-'+n))n++;slug=slug+'-'+n}
    used.add(slug);
    if(f.items.some(i=>i.sabor))f.items.forEach(i=>{if(!i.sabor)i.sabor='Original'});
    const pairs=new Map();f.items.forEach(i=>{const p=norm(i.tamano)+'|'+norm(i.sabor);pairs.set(p,(pairs.get(p)||0)+1)});
    const dups=[...pairs.values()].some(n=>n>1);
    const cat=Object.entries(f.cats).sort((a,b)=>b[1]-a[1])[0][0];
    S.sugs.push({key:k,nombre,slug,marca:f.brand,categoria:cat,items:f.items,dups,safe:!dups});
  });
  S.sugs.sort((a,b)=>(b.safe-a.safe)||b.items.length-a.items.length);
}
function sortSize(t){const m=String(t||'').match(/(\d+(?:\.\d+)?)\s*(\w+)/);if(!m)return 1e9;const n=Number(m[1]),u=m[2];return (u==='kg'?n*2.2046:u==='g'?n/453.6:u==='oz'?n/16:n)+({lb:0,kg:0,g:0,oz:0}[u]===0?0:1e6)}

/* ---------- Pintar ---------- */
function render(){
  const tab=(location.hash||'#productos').slice(1)==='sugerencias'?'sugerencias':'productos';
  [...$('tabs').children].forEach(a=>a.classList.toggle('on',a.dataset.s===tab));
  $('s-productos').hidden=tab!=='productos';$('s-sugerencias').hidden=tab!=='sugerencias';
  $('nP').textContent=published().length;$('nS').textContent=S.sugs.length;
  if(tab==='productos')renderGroups();else renderSugs();
}
function rangeOf(ids){const ps=ids.map(id=>offerOf(id)||pprice(P(id))).filter(n=>n>0);if(!ps.length)return '';const a=Math.min(...ps),b=Math.max(...ps);return a===b?money(a):money(a)+' – '+money(b)}
function renderGroups(){
  const q=norm($('q').value).trim(),all=S.groups.filter(g=>g.slug||(g.variantes||[]).length);
  const pubN=published().length,vars=published().reduce((n,g)=>n+(g.variantes||[]).length,0),old=S.groups.filter(g=>!g.slug).length;
  $('stats').innerHTML=`<div class="ins good"><i>🧬</i><b>${pubN}</b><span>Productos variables</span></div><div class="ins"><i>🎨</i><b>${vars}</b><span>Variaciones dentro</span></div><div class="ins"><i>🔗</i><b>${vars-pubN>0?vars-pubN:0}</b><span>URLs que ahora redirigen</span></div>${old?`<div class="ins bad"><i>🗂️</i><b>${old}</b><span>Grupos viejos sin URL</span></div>`:''}`;
  let L=all.filter(g=>!q||norm(g.nombre+' '+g.marca+' '+(g.slug||'')+' '+(g.variantes||[]).map(v=>v.sabor+' '+v.tamano).join(' ')).includes(q));
  L.sort((a,b)=>(!!b.slug-!!a.slug)||String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  $('list').innerHTML=L.length?L.map(g=>{
    const vs=(g.variantes||[]).filter(v=>P(v.producto_id)),ids=vs.map(v=>v.producto_id),T=new Set(vs.map(v=>v.tamano).filter(Boolean)),Sa=new Set(vs.map(v=>v.sabor).filter(Boolean));
    const im=g.imagen||pimg(P(g.principal_id))||pimg(P(ids[0]));
    return `<div class="pv" data-g="${g.id}">${im?`<img src="${esc(im)}" alt="" loading="lazy">`:'<div class="ph">🧬</div>'}<div style="min-width:0"><b>${esc(g.nombre)}</b><div class="u">${g.slug?'supgo.co/producto/'+esc(g.slug)+'/':'Sin URL propia (grupo viejo)'}</div><div class="tags">${g.slug?'<span class="tg ok">Publicado</span>':'<span class="tg warn">Pendiente</span>'}${T.size?`<span class="tg">${T.size} tamaño${T.size>1?'s':''}</span>`:''}${Sa.size?`<span class="tg">${Sa.size} sabor${Sa.size>1?'es':''}</span>`:''}${g.visible_publico===false?'<span class="tg no">Oculto</span>':''}</div></div><div class="pr">${rangeOf(ids)}<small>${vs.length} variaciones</small></div></div>`;
  }).join(''):`<div class="empty"><b>${q?'Sin resultados':'Aún no hay productos variables'}</b>${q?'':'Revisa la pestaña Sugerencias o crea uno con ＋.'}</div>`;
}
function renderSugs(){
  const q=norm($('q').value).trim(),safe=$('soloSeguras').checked;
  const L=S.sugs.filter(s=>(!safe||s.safe)&&(!q||norm(s.nombre+' '+s.marca+' '+s.items.map(i=>i.sabor+' '+i.tamano).join(' ')).includes(q)));
  S.list=L;S.shown=0;$('sugs').innerHTML='';moreSugs();
  $('pubSel').disabled=!S.sel.size;$('pubSel').textContent='Publicar seleccionadas'+(S.sel.size?' ('+S.sel.size+')':'');
}
function moreSugs(){
  const n=S.list.slice(S.shown,S.shown+40);
  $('sugs').insertAdjacentHTML('beforeend',n.map(s=>{
    const pairs=new Map();s.items.forEach(i=>{const p=norm(i.tamano)+'|'+norm(i.sabor);pairs.set(p,(pairs.get(p)||0)+1)});
    return `<div class="sg${s.safe?'':' warn'}" data-k="${esc(s.key)}"><div class="sgH">${s.safe?`<input type="checkbox" data-a="sel"${S.sel.has(s.key)?' checked':''}>`:''}<div class="t"><b>${esc(s.nombre)}</b><span class="u">supgo.co/producto/${esc(s.slug)}/ · ${s.items.length} productos → 1 URL</span></div><div class="pr" style="font-weight:800;font-size:13px">${rangeOf(s.items.map(i=>i.id))}</div></div>
      ${s.safe?'':'<p class="sgW">⚠ Hay variaciones con el mismo tamaño y sabor. Edítalas antes de publicar (o quita los duplicados).</p>'}
      <div class="sgM">${s.items.map(i=>`<span class="${pairs.get(norm(i.tamano)+'|'+norm(i.sabor))>1?'dup':''}" title="${esc(pname(P(i.id)))}">${esc([i.tamano,i.sabor].filter(Boolean).join(' · ')||'Sin datos')} <em>${money(offerOf(i.id)||pprice(P(i.id)))}</em></span>`).join('')}</div>
      <div class="sgA">${s.safe?'<button class="btn primary" data-a="pub">✓ Publicar</button>':''}<button class="btn" data-a="edit">Editar</button><button class="btn" data-a="no">No son el mismo</button></div></div>`;
  }).join(''));
  S.shown+=n.length;$('sugMore').textContent=S.list.length?(S.shown<S.list.length?'Mostrando '+S.shown+' de '+S.list.length:''):'';
  if(!S.list.length)$('sugs').innerHTML='<div class="empty"><b>Sin sugerencias</b>'+($('soloSeguras').checked?'Desmarca “Solo las que no tienen dudas” para ver las demás.':'No encontré más productos repetidos por sabor o tamaño.')+'</div>';
}
function fillLists(){
  const M=new Set(),C=new Set(),T=new Set(),Sa=new Set();
  S.prods.forEach(r=>{if(r.product.brand)M.add(r.product.brand);if(r.product.category)C.add(r.product.category)});
  S.groups.forEach(g=>(g.variantes||[]).forEach(v=>{if(v.tamano)T.add(v.tamano);if(v.sabor)Sa.add(v.sabor)}));
  S.sugs.forEach(s=>s.items.forEach(i=>{if(i.tamano)T.add(i.tamano);if(i.sabor)Sa.add(i.sabor)}));
  const opt=s=>[...s].sort((a,b)=>a.localeCompare(b,'es')).slice(0,600).map(x=>`<option value="${esc(x)}">`).join('');
  $('dlMarcas').innerHTML=opt(M);$('dlCats').innerHTML=opt(C);$('dlTam').innerHTML=opt(T);$('dlSab').innerHTML=opt(Sa);
}

/* ---------- Editor ---------- */
function openEditor(src){
  const E=S.E={id:src.id||null,nombre:src.nombre||'',slug:src.slug||'',marca:src.marca||'',categoria:src.categoria||'',imagen:src.imagen||'',descripcion:src.descripcion||'',titulo:src.titulo_seo||'',meta:src.meta_descripcion||'',visible:src.visible_publico!==false,principal:src.principal_id?String(src.principal_id):'',
    vars:(src.variantes||src.items||[]).filter(v=>P(v.producto_id||v.id)).map(v=>{const id=String(v.producto_id||v.id),r=P(id);return {id,tamano:v.tamano||'',sabor:v.sabor||'',price:pprice(r),trainer:Number(r.product.trainerPrice)||'',p0:pprice(r),t0:Number(r.product.trainerPrice)||''}}),sugKey:src.key||null};
  if(!E.principal&&E.vars.length){const v=E.vars.find(x=>x.price>0)||E.vars[0];E.principal=v.id}
  $('g_nombre').value=E.nombre;$('g_slug').value=E.slug;$('g_marca').value=E.marca;$('g_categoria').value=E.categoria;$('g_desc').value=E.descripcion;$('g_titulo').value=E.titulo;$('g_meta').value=E.meta;$('g_visible').checked=E.visible;
  $('shTitle').textContent=E.id?E.nombre:'Nuevo producto variable';$('shSub').textContent=E.id?(E.slug?'supgo.co/producto/'+E.slug+'/':'Grupo viejo: ponle una URL para publicarlo'):'Un producto, una URL, varias variaciones';
  $('shView').hidden=!E.slug||!E.id;$('shView').href=E.slug?'https://supgo.co/producto/'+E.slug+'/':'#';
  $('shDel').hidden=!E.id;
  S.dirty=false;$('shDirty').textContent='';
  renderVars();renderPhotos();slugCheck();counts();
  $('sheet').hidden=false;document.body.style.overflow='hidden';
  if(!E.nombre)setTimeout(()=>$('g_nombre').focus(),80);
}
function closeEditor(force){if(!force&&S.dirty&&!confirm('Tienes cambios sin guardar. ¿Salir igual?'))return;$('sheet').hidden=true;document.body.style.overflow='';S.E=null}
function dirty(){S.dirty=true;$('shDirty').textContent='Sin guardar'}
function renderVars(){
  const E=S.E,pairs=new Map();E.vars.forEach(v=>{const p=norm(v.tamano)+'|'+norm(v.sabor);pairs.set(p,(pairs.get(p)||0)+1)});
  $('vCount').textContent=E.vars.length?'('+E.vars.length+')':'';
  $('vars').innerHTML=E.vars.length?E.vars.map((v,i)=>{const r=P(v.id),im=pimg(r),of=offerOf(v.id);
    return `<div class="vr${E.principal===v.id?' main':''}${pairs.get(norm(v.tamano)+'|'+norm(v.sabor))>1?' dupe':''}" data-i="${i}">
      <button class="star" data-a="main" title="Mostrar primero">★</button>${im?`<img src="${esc(im)}" alt="" loading="lazy">`:'<div class="ph">📦</div>'}
      <div style="min-width:0"><div class="nm" title="${esc(pname(r))}">#${esc(v.id)} · ${esc(pname(r))}${of?`<span class="of">Oferta ${money(of)}</span>`:''}</div>
        <div class="vin"><input data-f="tamano" list="dlTam" placeholder="Tamaño" value="${esc(v.tamano)}"><input data-f="sabor" list="dlSab" placeholder="Sabor" value="${esc(v.sabor)}"></div>
        <div class="vin2"><div class="px"><input data-f="price" inputmode="numeric" placeholder="Precio" value="${v.price||''}"><button data-a="copyP" title="Copiar a todas las de este tamaño">⇣</button></div><div class="px"><input data-f="trainer" inputmode="numeric" placeholder="P. entrenador" value="${v.trainer||''}"><button data-a="copyT" title="Copiar a todas las de este tamaño">⇣</button></div></div></div>
      <button class="rm" data-a="rm" title="Quitar de este producto">✕</button></div>`}).join(''):'<div class="empty" style="padding:18px"><b>Sin variaciones</b>Agrega productos existentes o crea una nueva.</div>';
}
function renderPhotos(){
  const E=S.E,urls=[...new Set(E.vars.map(v=>pimg(P(v.id))).filter(Boolean))];
  $('photos').innerHTML=urls.length?`<button data-u="" class="${!E.imagen?'on':''}" title="Usar la de la variación elegida">Auto</button>`+urls.map(u=>`<button data-u="${esc(u)}" class="${E.imagen===u?'on':''}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join(''):'<p class="hint">Agrega variaciones con foto.</p>';
}
let slugTimer=0;
function slugCheck(){
  const E=S.E,s=$('g_slug').value.trim(),m=$('slugMsg');if(!E)return;
  if(!s){m.className='';m.textContent='se crea con el nombre';return}
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)){m.className='bad';m.textContent='solo minúsculas, números y guiones';return}
  const ids=new Set(E.vars.map(v=>v.id));
  if(S.groups.some(g=>g.slug===s&&String(g.id)!==String(E.id))){m.className='bad';m.textContent='ya la usa otro producto variable';return}
  const p=[...S.prods.values()].find(r=>r.slug===s&&!ids.has(String(r.id)));
  if(p){m.className='bad';m.textContent='ya la usa “'+pname(p)+'”';return}
  m.className='ok';m.textContent='✓ disponible';
}
function counts(){$('tCount').textContent=$('g_titulo').value.length?$('g_titulo').value.length+'/60':'';$('mCount').textContent=$('g_meta').value.length?$('g_meta').value.length+'/160':''}
async function save(){
  const E=S.E;if(!E)return;
  E.nombre=$('g_nombre').value.trim();E.slug=($('g_slug').value.trim()||slugify(E.nombre));$('g_slug').value=E.slug;slugCheck();
  if(!E.nombre)return toast('Ponle nombre al producto','err');
  if(!E.vars.length)return toast('Agrega al menos una variación','err');
  if($('slugMsg').classList.contains('bad'))return toast('Revisa la URL: '+$('slugMsg').textContent,'err');
  const pairs=new Set();for(const v of E.vars){const p=norm(v.tamano)+'|'+norm(v.sabor);if(E.vars.length>1&&pairs.has(p))return toast('Hay dos variaciones con el mismo tamaño y sabor ('+([v.tamano,v.sabor].filter(Boolean).join(' · ')||'vacías')+')','err');pairs.add(p)}
  const b=$('shSave');b.disabled=true;b.textContent='Guardando…';
  try{
    const r=await rpc('guardar',{id:E.id,nombre:E.nombre,slug:E.slug,marca:$('g_marca').value.trim(),categoria:$('g_categoria').value.trim(),imagen:E.imagen,descripcion:$('g_desc').value.trim()||null,
      titulo_seo:$('g_titulo').value.trim()||null,meta_descripcion:$('g_meta').value.trim()||null,principal_id:E.principal||null,visible_publico:$('g_visible').checked,
      variantes:E.vars.map(v=>({producto_id:Number(v.id),tamano:v.tamano.trim(),sabor:v.sabor.trim()}))});
    const ch=E.vars.filter(v=>String(v.price)!==String(v.p0)||String(v.trainer)!==String(v.t0)).map(v=>({producto_id:Number(v.id),price:String(v.price||''),trainerPrice:String(v.trainer||'')}));
    if(ch.length){await rpc('precios',{items:ch});ch.forEach(c=>{const p=P(c.producto_id);if(p){if(c.price)p.product.price=Number(c.price);p.product.trainerPrice=c.trainerPrice?Number(c.trainerPrice):null}})}
    if(E.sugKey){S.sugs=S.sugs.filter(s=>s.key!==E.sugKey);S.sel.delete(E.sugKey)}
    toast('Guardado ✓ · supgo.co/producto/'+E.slug+'/');S.dirty=false;closeEditor(true);
    const g=await rpc('list');S.groups=g.grupos||[];suggest();render();
  }catch(e){toast(e.message,'err')}
  b.disabled=false;b.textContent='Guardar';
}
async function quickPublish(keys){
  let ok=0,fail=0;
  for(const k of keys){
    const s=S.sugs.find(x=>x.key===k);if(!s)continue;
    const main=s.items.find(i=>pprice(P(i.id))>0)||s.items[0];
    try{await rpc('guardar',{nombre:s.nombre,slug:s.slug,marca:s.marca,categoria:s.categoria,principal_id:Number(main.id),visible_publico:true,variantes:s.items.map(i=>({producto_id:Number(i.id),tamano:i.tamano,sabor:i.sabor}))});ok++;S.sel.delete(k)}
    catch(e){fail++;toast(s.nombre+': '+e.message,'err')}
  }
  const g=await rpc('list');S.groups=g.grupos||[];suggest();render();
  toast(ok+' producto'+(ok===1?'':'s')+' publicado'+(ok===1?'':'s')+(fail?' · '+fail+' con error':'')+' ✓');
}

/* ---------- Agregar variaciones ---------- */
let pickSel=new Set();
function openPick(){pickSel=new Set();$('pickQ').value=S.E.nombre||'';$('pick').hidden=false;renderPick();setTimeout(()=>$('pickQ').select(),60)}
function renderPick(){
  const q=norm($('pickQ').value).trim().split(/\s+/).filter(Boolean),inE=new Set(S.E.vars.map(v=>v.id)),mem=memberOf();
  const L=[...S.prods.values()].filter(r=>{const t=norm(pname(r)+' '+(r.product.brand||'')+' '+r.id);return q.every(w=>t.includes(w))}).slice(0,80);
  $('pickList').innerHTML=L.length?L.map(r=>{const id=String(r.id),g=mem.get(id),im=pimg(r),here=inE.has(id);
    return `<label class="${here?'in':''}"><input type="checkbox" value="${id}"${here?' disabled checked':pickSel.has(id)?' checked':''}>${im?`<img src="${esc(im)}" alt="" loading="lazy">`:'<div class="ph"></div>'}<span style="min-width:0">${esc(pname(r))}<small>#${id} · ${esc(r.product.brand||'')}${g&&!here?' · en “'+esc(g.nombre)+'”':''}</small></span><span class="pp">${money(pprice(r))}</span></label>`}).join(''):'<p class="hint" style="padding:10px">Sin resultados.</p>';
}
function addPicked(){
  const E=S.E;pickSel.forEach(id=>{if(E.vars.some(v=>v.id===id))return;const r=P(id),x=parse(r);E.vars.push({id,tamano:x.tamano,sabor:x.sabor,price:pprice(r),trainer:Number(r.product.trainerPrice)||'',p0:pprice(r),t0:Number(r.product.trainerPrice)||''})});
  if(!E.principal&&E.vars.length)E.principal=E.vars[0].id;
  if(!$('g_nombre').value.trim()&&E.vars.length){const r=P(E.vars[0].id),x=parse(r);$('g_nombre').value=x.core+(r.product.brand&&!norm(x.core).includes(norm(r.product.brand))?' '+r.product.brand:'');if(!$('g_marca').value)$('g_marca').value=r.product.brand||'';if(!$('g_categoria').value)$('g_categoria').value=r.product.category||'';if(!$('g_slug').value)$('g_slug').value=slugify($('g_nombre').value)}
  $('pick').hidden=true;dirty();renderVars();renderPhotos();slugCheck();
}
async function createVar(){
  const E=S.E,base=E.vars.find(v=>v.id===E.principal)||E.vars[0];if(!base)return;
  const tam=$('nTam').value.trim(),sab=$('nSab').value.trim(),pre=$('nPre').value.replace(/\D/g,'');
  if(!tam&&!sab)return toast('Escribe el tamaño o el sabor','err');
  const nombre=[$('g_nombre').value.trim()||parse(P(base.id)).core,tam,sab].filter(Boolean).join(' ');
  const b=$('nOk');b.disabled=true;
  try{
    const r=await rpc('crear_variacion',{base_id:Number(base.id),nombre,tamano:tam,sabor:sab,price:pre});
    S.prods.set(String(r.id),{id:r.id,slug:r.slug,activo:true,product:r.product});
    E.vars.push({id:String(r.id),tamano:tam,sabor:sab,price:Number(pre)||pprice(P(r.id)),trainer:'',p0:Number(pre)||pprice(P(r.id)),t0:''});
    $('nueva').hidden=true;dirty();renderVars();renderPhotos();toast('Variación creada (#'+r.id+'). Guarda para unirla al producto.');
  }catch(e){toast(e.message,'err')}
  b.disabled=false;
}

/* ---------- Varios ---------- */
function toast(m,k){const t=document.createElement('div');t.className='toast'+(k==='err'?' err':'');t.innerHTML='<span>'+esc(m)+'</span>';$('toasts').appendChild(t);while($('toasts').children.length>3)$('toasts').firstChild.remove();setTimeout(()=>t.remove(),4800)}
function lock(m){$('lock').hidden=false;$('lockErr').textContent=m||'';setTimeout(()=>$('lockPw').focus(),50)}
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};

try{if(window.top!==window)document.documentElement.classList.add('embedded')}catch(e){document.documentElement.classList.add('embedded')}
window.addEventListener('hashchange',render);
$('q').oninput=debounce(render,150);
$('soloSeguras').onchange=render;
$('list').onclick=e=>{const c=e.target.closest('[data-g]');if(!c)return;const g=S.groups.find(x=>String(x.id)===c.dataset.g);if(g)openEditor(g)};
$('sugs').onclick=async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;const k=b.closest('[data-k]').dataset.k,s=S.sugs.find(x=>x.key===k);if(!s)return;
  if(b.dataset.a==='sel'){b.checked?S.sel.add(k):S.sel.delete(k);$('pubSel').disabled=!S.sel.size;$('pubSel').textContent='Publicar seleccionadas'+(S.sel.size?' ('+S.sel.size+')':'');return}
  if(b.dataset.a==='edit')openEditor(Object.assign({},s));
  if(b.dataset.a==='no'){S.dismissed.add(k);ls(DISMISS,[...S.dismissed]);S.sugs=S.sugs.filter(x=>x.key!==k);b.closest('.sg').remove();$('nS').textContent=S.sugs.length}
  if(b.dataset.a==='pub'){b.disabled=true;b.textContent='Publicando…';await quickPublish([k])}
};
$('pubSel').onclick=async()=>{const ks=[...S.sel];if(!ks.length)return;if(!confirm('¿Publicar '+ks.length+' productos variables? Las URLs de cada sabor pasarán a redirigir a la nueva.'))return;$('pubSel').disabled=true;$('pubSel').textContent='Publicando…';await quickPublish(ks)};
$('fab').onclick=()=>openEditor({});
$('sheet').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeEditor()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('sheet').hidden&&$('pick').hidden&&$('nueva').hidden)closeEditor()});
['g_nombre','g_marca','g_categoria','g_desc','g_titulo','g_meta','g_visible'].forEach(id=>$(id).addEventListener('input',()=>{dirty();counts()}));
$('g_nombre').addEventListener('input',()=>{if(!S.E.id||!S.E.slug){$('g_slug').value=slugify($('g_nombre').value);slugCheck()}});
$('g_slug').addEventListener('input',()=>{dirty();clearTimeout(slugTimer);slugTimer=setTimeout(slugCheck,200)});
$('vars').addEventListener('input',e=>{const f=e.target.dataset.f;if(!f)return;const v=S.E.vars[e.target.closest('[data-i]').dataset.i];v[f]=f==='price'||f==='trainer'?e.target.value.replace(/\D/g,''):e.target.value;if(f==='price'||f==='trainer')e.target.value=v[f];dirty()});
$('vars').addEventListener('change',e=>{if(e.target.dataset.f==='tamano'||e.target.dataset.f==='sabor')renderVars()});
$('vars').addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;const i=Number(b.closest('[data-i]').dataset.i),E=S.E,v=E.vars[i];
  if(b.dataset.a==='main'){E.principal=v.id;dirty();renderVars()}
  if(b.dataset.a==='rm'){E.vars.splice(i,1);if(E.principal===v.id)E.principal=E.vars[0]?E.vars[0].id:'';dirty();renderVars();renderPhotos()}
  if(b.dataset.a==='copyP'||b.dataset.a==='copyT'){const f=b.dataset.a==='copyP'?'price':'trainer';let n=0;E.vars.forEach(x=>{if(x!==v&&norm(x.tamano)===norm(v.tamano)){x[f]=v[f];n++}});dirty();renderVars();toast(n?'Copiado a '+n+' variación'+(n===1?'':'es')+(v.tamano?' de '+v.tamano:''):'No hay otras del mismo tamaño')}
});
$('photos').onclick=e=>{const b=e.target.closest('[data-u]');if(!b)return;S.E.imagen=b.dataset.u;dirty();renderPhotos()};
$('shSave').onclick=save;
$('shDel').onclick=async()=>{const E=S.E;if(!E||!E.id)return;if(!confirm('¿Deshacer “'+E.nombre+'”? Sus variaciones vuelven a ser productos sueltos, cada uno con su URL de antes.'))return;try{await rpc('eliminar',{id:E.id});toast('Listo: las variaciones quedaron sueltas');S.dirty=false;closeEditor(true);const g=await rpc('list');S.groups=g.grupos||[];suggest();render()}catch(x){toast(x.message,'err')}};
$('addExisting').onclick=openPick;
$('pickQ').oninput=debounce(renderPick,120);
$('pickList').addEventListener('change',e=>{const i=e.target;if(i.type!=='checkbox')return;i.checked?pickSel.add(i.value):pickSel.delete(i.value)});
$('pick').addEventListener('click',e=>{if(e.target.closest('[data-pclose]'))$('pick').hidden=true});
$('pickOk').onclick=addPicked;
$('addNew').onclick=()=>{const E=S.E;if(!E.vars.length)return toast('Primero agrega una variación existente para copiar su ficha','err');const base=E.vars.find(v=>v.id===E.principal)||E.vars[0];$('nBase').textContent=pname(P(base.id));$('nTam').value='';$('nSab').value='';$('nPre').value=base.price||'';$('nueva').hidden=false;setTimeout(()=>$('nTam').focus(),60)};
$('nueva').addEventListener('click',e=>{if(e.target.closest('[data-nclose]'))$('nueva').hidden=true});
$('nOk').onclick=createVar;
$('sugMore').textContent='';new IntersectionObserver(es=>{if(es[0].isIntersecting&&S.list&&S.shown<S.list.length)moreSugs()},{rootMargin:'500px'}).observe($('sugMore'));
$('lockForm').onsubmit=async e=>{e.preventDefault();try{sessionStorage.setItem(PASS,$('lockPw').value)}catch(x){}$('lockErr').textContent='Verificando…';try{await rpc('list');$('lock').hidden=true;load()}catch(x){$('lockErr').textContent=/Clave/.test(x.message)?'Clave incorrecta':'Sin conexión'}};
window.supgoVariables={S,suggest,parse};
if(!pw())lock();else load();
})();

/* SUPGO · Catálogo (SUPGO CONTROL)
   App independiente del admin antiguo. Lee de Supabase (REST público) y guarda con las
   mismas funciones seguras del admin (lift-catalog-admin, lift_producto_imagenes_guardar,
   lift-catalogo-imagen), siempre con la clave de administración. */
(function(){
'use strict';
const SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const PASS='liftAdminCloudPasswordV1',VIEWK='supgoCatView';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CO');
const num=v=>{const n=Number(String(v==null?'':v).replace(/[^\d]/g,''));return Number.isFinite(n)?n:0};
const fmtIn=n=>n?Math.round(n).toLocaleString('es-CO'):'';
const slugify=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- Estado ---------- */
const S={
  rows:[],          // todas las filas de lift_productos (incluye borradas, para el siguiente ID)
  products:[],      // productos visibles en el admin
  byId:new Map(),
  cfg:{weekly_offers:{},admin_meta:{},categories_v1:{},laboratories_v1:{}},
  groups:null,      // grupos de variaciones (carga bajo demanda)
  sel:new Set(),
  filters:{flags:new Set(),cat:'',lab:'',q:'',sort:'name'},
  view:(()=>{try{return localStorage.getItem(VIEWK)||'list'}catch(e){return 'list'}})(),
  shown:0,list:[],
  section:'productos',
  edit:null          // ficha abierta
};
const pw=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};

/* ---------- Red ---------- */
async function rest(path,opt={}){
  const r=await fetch(SB+'/rest/v1/'+path,{...opt,headers:{apikey:KEY,Authorization:'Bearer '+KEY,...(opt.headers||{})}});
  if(!r.ok)throw new Error('Supabase '+r.status);
  return r.json();
}
async function fn(name,body){
  const r=await fetch(SB+'/functions/v1/'+name,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({password:pw(),...body})});
  const j=await r.json().catch(()=>({}));
  if(r.status===401){lockScreen('La clave cambió o no es válida');throw new Error('Clave incorrecta')}
  if(!r.ok||j.error)throw new Error(j.error||('Error '+r.status));
  return j;
}
async function rpc(name,args){
  const r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify(args)});
  const j=await r.json().catch(()=>null);
  if(!r.ok)throw new Error((j&&j.message)||'Error '+r.status);
  return j;
}
// Cola de escritura: una cosa a la vez, para no pisar cambios.
let queue=Promise.resolve(),pending=0;
function enqueue(task){
  pending++;sync('busy');
  const p=queue.then(task);
  queue=p.catch(()=>{}).then(()=>{pending--;if(!pending)sync('ok')});
  return p;
}
function sync(state,text){
  const el=$('sync');el.className='sync '+state;
  el.querySelector('span').textContent=text||(state==='ok'?'Sincronizado con Supabase':state==='busy'?'Guardando…':state==='err'?'Sin conexión':'Conectando…');
}
const saveProduct=p=>enqueue(()=>fn('lift-catalog-admin',{action:'save',product:clean(p)}));
function clean(p){const o={...p};delete o._q;delete o._score;delete o._tips;return o}
const sig=p=>JSON.stringify(clean(p));
// Configuración: siempre se lee la versión más reciente antes de guardar.
function saveCfg(clave,mutate){
  return enqueue(async()=>{
    const rows=await rest('lift_catalog_config?select=valor&clave=eq.'+encodeURIComponent(clave));
    const cur=(rows[0]&&rows[0].valor)||{};
    const next=mutate(JSON.parse(JSON.stringify(cur)))||cur;
    await fn('lift-catalog-admin',{action:'save-config',clave,valor:next});
    S.cfg[clave]=next;return next;
  });
}

/* ---------- Carga ---------- */
async function load(){
  sync('load');skeleton();
  try{
    const [rows,cfg]=await Promise.all([
      (async()=>{let all=[],from=0;for(;;){const r=await fetch(SB+'/rest/v1/lift_productos?select=id,product,activo&order=id',{headers:{apikey:KEY,Authorization:'Bearer '+KEY,Range:from+'-'+(from+999)}});if(!r.ok)throw new Error('Supabase '+r.status);const b=await r.json();all=all.concat(b);if(b.length<1000)break;from+=1000}return all})(),
      rest('lift_catalog_config?select=clave,valor&clave=in.(weekly_offers,admin_meta,categories_v1,laboratories_v1)')
    ]);
    cfg.forEach(c=>{S.cfg[c.clave]=c.valor||{}});
    S.rows=rows;
    S.products=rows.filter(r=>r.activo!==false&&r.product&&!r.product.__deleted&&r.product.name).map(r=>({...r.product,id:Number(r.id)}));
    S.byId=new Map(S.products.map(p=>[p.id,p]));
    S.products.forEach(score);
    sync('ok');
    fillLists();renderSection();
  }catch(e){sync('err');$('plist').innerHTML='<div class="empty"><b>No pude cargar el catálogo</b>'+esc(e.message)+'<br><br><button class="btn" onclick="location.reload()">Reintentar</button></div>'}
}
function skeleton(){$('plist').innerHTML=Array.from({length:8},()=>'<div class="skel"></div>').join('');$('insights').innerHTML=Array.from({length:6},()=>'<div class="skel" style="height:70px"></div>').join('')}

/* ---------- Reglas del producto ---------- */
const isOut=p=>!!(S.cfg.admin_meta&&S.cfg.admin_meta.out&&S.cfg.admin_meta.out[p.id]);
function offerOf(p){const o=S.cfg.weekly_offers&&S.cfg.weekly_offers[p.id];if(!o||!Number(o.price))return null;const until=o.promoUntil?new Date(o.promoUntil):null;return {...o,until,expired:!!(until&&until<new Date())}}
function score(p){
  const tips=[];let s=0;
  if(p.image)s+=30;else tips.push(['fotos','Agrega una foto']);
  if(Number(p.price)>0)s+=25;else tips.push(['general','Pon el precio']);
  if(String(p.description||'').replace(/<[^>]+>/g,'').trim().length>=60)s+=15;else tips.push(['general','Escribe la descripción']);
  if(p.category)s+=10;else tips.push(['general','Elige categoría']);
  if(p.brand)s+=5;else tips.push(['general','Elige laboratorio']);
  if(p.seo&&p.seo.title&&p.seo.meta)s+=15;else tips.push(['seo','Completa el SEO']);
  p._score=s;p._tips=tips;
  p._q=norm([p.id,p.name,p.brand,p.category,p.presentation,(p.flavors||[]).join(' '),p.flavor].join(' '));
  return s;
}
const scoreColor=s=>s>=85?'#22c55e':s>=60?'#f59e0b':'#ef4444';

/* ---------- Productos: filtros ---------- */
const FLAGS=[
  ['all','Activos','📦',p=>true,''],
  ['out','Agotados','⦸',p=>isOut(p),'bad'],
  ['offer','En oferta','🔥',p=>{const o=offerOf(p);return o&&!o.expired},'good'],
  ['nophoto','Sin foto','📷',p=>!p.image,'warn'],
  ['noprice','Sin precio','💲',p=>!(Number(p.price)>0),'warn'],
  ['nodesc','Sin descripción','✍️',p=>String(p.description||'').replace(/<[^>]+>/g,'').trim().length<60,'warn'],
  ['noseo','SEO incompleto','🔎',p=>!(p.seo&&p.seo.title&&p.seo.meta),'warn'],
  ['combo','Combos','🎁',p=>norm(p.category)==='combos','']
];
function applyFilters(){
  const f=S.filters,q=norm(f.q).split(/\s+/).filter(Boolean);
  let a=S.products.filter(p=>{
    if(f.cat&&p.category!==f.cat)return false;
    if(f.lab&&p.brand!==f.lab)return false;
    for(const k of f.flags){const fl=FLAGS.find(x=>x[0]===k);if(fl&&!fl[3](p))return false}
    for(const w of q)if(p._q.indexOf(w)<0)return false;
    return true;
  });
  const by={name:(x,y)=>String(x.name).localeCompare(String(y.name),'es'),new:(x,y)=>y.id-x.id,pdesc:(x,y)=>(Number(y.price)||0)-(Number(x.price)||0),pasc:(x,y)=>(Number(x.price)||0)-(Number(y.price)||0),quality:(x,y)=>x._score-y._score||String(x.name).localeCompare(String(y.name),'es')}[f.sort];
  a.sort(by);return a;
}
function renderInsights(){
  $('insights').innerHTML=FLAGS.map(([k,label,ico,test,cls])=>{
    const n=k==='all'?S.products.length:S.products.filter(test).length;
    const on=k==='all'?S.filters.flags.size===0:S.filters.flags.has(k);
    return `<button class="ins ${cls}${on?' on':''}" data-flag="${k}"><i>${ico}</i><b>${n.toLocaleString('es-CO')}</b><span>${label}</span></button>`;
  }).join('');
}
function renderProducts(reset=true){
  if(reset){S.list=applyFilters();S.shown=0;$('plist').innerHTML='';}
  const box=$('plist');box.className='plist '+S.view;
  [...document.querySelectorAll('#viewSeg button')].forEach(b=>b.classList.toggle('on',b.dataset.v===S.view));
  const next=S.list.slice(S.shown,S.shown+60);
  box.insertAdjacentHTML('beforeend',next.map(rowHTML).join(''));
  S.shown+=next.length;
  const total=S.list.length;
  $('count').textContent=total===S.products.length?total.toLocaleString('es-CO')+' productos':total.toLocaleString('es-CO')+' de '+S.products.length.toLocaleString('es-CO')+' productos';
  const filtered=S.filters.flags.size||S.filters.cat||S.filters.lab||S.filters.q;
  $('clearFilters').hidden=!filtered;
  const nf=(S.filters.cat?1:0)+(S.filters.lab?1:0)+(S.filters.sort!=='name'?1:0);$('fToggle').textContent=nf?'⚙ Filtros · '+nf:'⚙ Filtros';$('fToggle').classList.toggle('on',!!nf);
  $('more').textContent=S.shown<total?'Cargando más…':(total?'':'');
  if(!total)box.innerHTML='<div class="empty"><b>Nada por aquí</b>No hay productos con estos filtros.</div>';
  updateSelAll();
}
function rowHTML(p){
  const out=isOut(p),o=offerOf(p),sel=S.sel.has(p.id),s=p._score;
  const badges=[];
  if(o&&!o.expired)badges.push(`<span class="bdg offer">🔥 ${money(o.price)}</span>`);
  if(o&&o.expired)badges.push('<span class="bdg warn">Oferta vencida</span>');
  if(p.adminOnly||p.__private)badges.push('<span class="bdg admin">Solo admin</span>');
  if(!p.image)badges.push('<span class="bdg warn">Sin foto</span>');
  return `<div class="pr${sel?' sel':''}${out?' isOut':''}" data-id="${p.id}">
    <label class="chk"><input type="checkbox" data-sel ${sel?'checked':''}><span></span></label>
    ${p.image?`<img class="thumb" loading="lazy" decoding="async" src="${esc(p.image)}" alt="" data-open onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'thumb empty',textContent:'⚠️',title:'La foto no carga'}))">`:'<div class="thumb empty" data-open>📷</div>'}
    <div class="pInfo" data-open><div class="pName">${esc(p.name)}</div><div class="pMeta">${esc([p.brand,p.category,p.presentation].filter(Boolean).join(' · '))}</div>${badges.length?`<div class="badges">${badges.join('')}</div>`:''}</div>
    <div class="pAct"><div class="priceIn"><input data-price value="${fmtIn(p.price)}" inputmode="numeric" aria-label="Precio de ${esc(p.name)}" placeholder="Precio"></div>
    <button class="sw${out?'':' on'}" data-sw type="button"><i></i><span>${out?'Agotado':'Disponible'}</span></button></div>
    <button class="ring" data-open style="--p:${s};--c:${scoreColor(s)}" title="Ficha completa al ${s}%"><b>${s}</b></button>
    <button class="open" data-open title="Abrir ficha">›</button>
  </div>`;
}
function refreshRow(id){
  const p=S.byId.get(id),el=document.querySelector('.pr[data-id="'+id+'"]');
  if(!el||!p)return;el.outerHTML=rowHTML(p);
}
function updateSelAll(){
  const all=$('selAll'),vis=S.list.length,selVis=S.list.filter(p=>S.sel.has(p.id)).length;
  all.checked=vis>0&&selVis===vis;all.indeterminate=selVis>0&&selVis<vis;
  $('bulk').hidden=S.sel.size===0;$('bulkN').textContent=S.sel.size;
}
function fillLists(){
  const cats=[...new Set([...S.products.map(p=>p.category),...Object.keys(S.cfg.categories_v1||{}).filter(k=>{const c=S.cfg.categories_v1[k];return c&&!c.__deleted&&c.active!==false})].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const labs=[...new Set([...S.products.map(p=>p.brand),...Object.keys(S.cfg.laboratories_v1||{}).filter(k=>{const c=S.cfg.laboratories_v1[k];return c&&!c.__deleted&&c.active!==false})].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  S.cats=cats;S.labs=labs;
  const opt=(arr,first,cur)=>'<option value="">'+first+'</option>'+arr.map(x=>`<option${x===cur?' selected':''}>${esc(x)}</option>`).join('');
  $('fCat').innerHTML=opt(cats,'Todas las categorías',S.filters.cat);
  $('fLab').innerHTML=opt(labs,'Todos los laboratorios',S.filters.lab);
  $('dlCats').innerHTML=cats.map(c=>`<option value="${esc(c)}">`).join('');
  $('dlLabs').innerHTML=labs.map(c=>`<option value="${esc(c)}">`).join('');
}

/* ---------- Cambios rápidos en la lista ---------- */
async function quickPrice(id,input){
  const p=S.byId.get(id);if(!p)return;
  const v=num(input.value),old=Number(p.price)||0;
  if(v===old){input.value=fmtIn(old);return}
  if(v<=0){toast('El precio debe ser mayor a 0','err');input.value=fmtIn(old);return}
  const wrap=input.parentElement;wrap.classList.add('saving');
  p.price=v;score(p);input.value=fmtIn(v);
  try{await saveProduct(p);wrap.classList.remove('saving');wrap.classList.add('saved');setTimeout(()=>wrap.classList.remove('saved'),1200);
    toast(`Precio de ${short(p.name)}: ${money(v)}`,'',async()=>{p.price=old;score(p);await saveProduct(p);refreshRow(id);toast('Precio restaurado')});
  }catch(e){p.price=old;score(p);input.value=fmtIn(old);wrap.classList.remove('saving');toast('No se guardó: '+e.message,'err')}
}
async function setOut(ids,out){
  ids=[...ids];
  await saveCfg('admin_meta',m=>{m.out=m.out||{};ids.forEach(id=>{if(out)m.out[id]=true;else delete m.out[id]});return m});
}
async function quickStatus(id){
  const p=S.byId.get(id);if(!p)return;const was=isOut(p);
  try{await setOut([id],!was);refreshRow(id);renderInsights();
    toast(`${short(p.name)}: ${!was?'Agotado':'Disponible'}`,'',async()=>{await setOut([id],was);refreshRow(id);renderInsights()});
  }catch(e){toast('No se guardó: '+e.message,'err')}
}
const short=s=>{s=String(s||'');return s.length>34?s.slice(0,32)+'…':s};

/* ---------- Ficha ---------- */
function openSheet(id,isNew){
  let p;
  if(isNew){p={id:nextId(),name:'',brand:S.filters.lab||'',category:S.filters.cat||'',price:0,image:'',description:'',flavors:[],presentation:'',seo:{}};}
  else{const src=S.byId.get(id);if(!src)return;p=JSON.parse(JSON.stringify(clean(src)));}
  score(p);
  const o=offerOf(p)||{};
  S.edit={p,isNew:!!isNew,orig:sig(p),out:isNew?false:isOut(p),outOrig:isNew?false:isOut(p),
    offer:{price:o.price||0,until:o.until?toDateIn(o.until):'',note:o.note||''},offerOrig:null,photos:[],photosOrig:'',tab:'general'};
  S.edit.offerOrig=JSON.stringify(S.edit.offer);
  $('sheet').hidden=false;document.body.style.overflow='hidden';
  fillSheet();tab('general');
  // Fotos adicionales desde su tabla
  S.edit.photos=p.image?[p.image]:[];S.edit.photosOrig=JSON.stringify(S.edit.photos);renderPhotos();
  if(!isNew)rest('lift_producto_imagenes?select=imagen_url,orden&producto_id=eq.'+p.id+'&order=orden').then(r=>{
    if(!S.edit||S.edit.p.id!==p.id)return;
    const extra=r.map(x=>x.imagen_url).filter(u=>u&&u!==p.image);
    S.edit.photos=[...(p.image?[p.image]:[]),...extra];S.edit.photosOrig=JSON.stringify(S.edit.photos);renderPhotos();
  }).catch(()=>{});
  setTimeout(()=>{if(isNew)$('e_name').focus()},250);
}
function nextId(){let m=0;S.rows.forEach(r=>{const n=Number(r.id);if(n>m)m=n});S.products.forEach(p=>{if(p.id>m)m=p.id});return m+1}
const toDateIn=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
function fillSheet(){
  const {p}=S.edit;
  $('shTitle').textContent=S.edit.isNew?'Nuevo producto':(p.name||'Producto');
  $('shSub').textContent=S.edit.isNew?'ID '+p.id+' · se crea al guardar':'ID '+p.id+(p.brand?' · '+p.brand:'');
  $('shView').href='/?producto='+p.id;$('shView').hidden=S.edit.isNew;
  $('shDel').hidden=S.edit.isNew;$('shDup').hidden=S.edit.isNew;
  $('e_name').value=p.name||'';$('e_brand').value=p.brand||'';$('e_category').value=p.category||'';
  $('e_price').value=fmtIn(p.price);$('e_trainer').value=fmtIn(p.trainerPrice);$('e_presentation').value=p.presentation||'';
  $('e_description').value=String(p.description||'');
  $('e_meta').textContent=p.source?'Origen: '+p.source+(p.source_id?' · '+p.source_id:''):'';
  statusSeg();
  $('o_price').value=fmtIn(S.edit.offer.price);$('o_until').value=S.edit.offer.until;$('o_note').value=S.edit.offer.note;offerInfo();
  const seo=p.seo||{};$('s_title').value=seo.title||'';$('s_meta').value=seo.meta||'';$('s_slug').value=seo.slug||'';seoPrev();
  renderFlavors();descCount();scoreBar();dirty();
}
function statusSeg(){[...$('e_status').children].forEach(b=>b.classList.toggle('on',(b.dataset.v==='out')===S.edit.out))}
function readSheet(){
  const {p}=S.edit;
  p.name=$('e_name').value.trim();p.brand=$('e_brand').value.trim();p.category=$('e_category').value.trim();
  p.price=num($('e_price').value);const t=num($('e_trainer').value);if(t)p.trainerPrice=t;else delete p.trainerPrice;
  p.presentation=$('e_presentation').value.trim();p.description=$('e_description').value;
  p.seo={...(p.seo||{}),title:$('s_title').value.trim(),meta:$('s_meta').value.trim(),slug:$('s_slug').value.trim()};
  if(!p.seo.title&&!p.seo.meta&&!p.seo.slug&&Object.keys(p.seo).length===3)delete p.seo;
  p.image=S.edit.photos[0]||'';
  S.edit.offer={price:num($('o_price').value),until:$('o_until').value,note:$('o_note').value.trim()};
}
function isDirty(){if(!S.edit)return false;readSheet();const e=S.edit;return sig(e.p)!==e.orig||e.out!==e.outOrig||JSON.stringify(e.offer)!==e.offerOrig||JSON.stringify(e.photos)!==e.photosOrig}
const dirty=debounce(()=>{if(!S.edit)return;const d=isDirty();$('shDirty').textContent=d?'Cambios sin guardar':'';score(S.edit.p);scoreBar()},120);
function scoreBar(){
  const p=S.edit.p,s=p._score;
  $('shScore').innerHTML=`<div style="flex:1"><div style="display:flex;justify-content:space-between;font-weight:600"><span>Ficha completa</span><span style="color:${scoreColor(s)}">${s}%</span></div><div class="bar" style="margin-top:6px"><i style="width:${s}%;background:${scoreColor(s)}"></i></div>${p._tips.length?`<div class="tips">${p._tips.map(t=>`<button data-tip="${t[0]}">${t[1]}</button>`).join('')}</div>`:''}</div>`;
}
function tab(t){S.edit.tab=t;[...$('shTabs').children].forEach(b=>b.classList.toggle('on',b.dataset.t===t));[...document.querySelectorAll('.pane')].forEach(x=>x.classList.toggle('on',x.dataset.p===t));$('shBody').scrollTop=0}
function descCount(){const n=$('e_description').value.replace(/<[^>]+>/g,'').trim().length;const e=$('descCount');e.textContent=n+' caracteres';e.className=n>=60?'ok':'bad'}
function offerInfo(){
  const base=num($('e_price').value),op=num($('o_price').value),u=$('o_until').value,el=$('o_info');
  $('o_remove').hidden=!op;
  if(!op){el.textContent='';return}
  if(base&&op>=base){el.innerHTML='⚠️ El precio de oferta debe ser menor al precio normal ('+money(base)+').';return}
  const pct=base?Math.round((1-op/base)*100):0;
  const days=u?Math.ceil((new Date(u+'T23:59:59')-new Date())/864e5):null;
  el.innerHTML=`<b>${money(op)}</b> en vez de ${money(base)} · <b>-${pct}%</b>`+(u?(days<0?' · ya venció':' · '+(days===0?'vence hoy':'quedan '+days+' día'+(days===1?'':'s'))):' · <b>elige fecha de fin</b>');
}
function seoPrev(){
  const p=S.edit.p,t=$('s_title').value||(($('e_name').value||'Producto')+' | Supgo'),m=$('s_meta').value||'Agrega una meta descripción para Google.',slug=$('s_slug').value||slugify($('e_name').value);
  $('gprev').innerHTML=`<div class="u">supgo.co › ${esc(slug)}</div><div class="t">${esc(t)}</div><div class="d">${esc(m)}</div>`;
  const tc=$('s_title').value.length,mc=$('s_meta').value.length;
  $('seoTc').textContent=tc+'/60';$('seoTc').className=tc&&tc<=60?'ok':tc>60?'bad':'';
  $('seoMc').textContent=mc+'/160';$('seoMc').className=mc>=70&&mc<=160?'ok':mc>160?'bad':'';
}
function autoSeo(){
  const n=$('e_name').value.trim(),b=$('e_brand').value.trim(),c=$('e_category').value.trim();
  if(!n){toast('Primero escribe el nombre','err');return}
  if(!$('s_title').value)$('s_title').value=(n+' | Supgo').slice(0,60);
  if(!$('s_meta').value)$('s_meta').value=(`Compra ${n}${b?' de '+b:''} en Supgo. ${c?c+' originales, ':''}precio actualizado y envíos a toda Colombia.`).slice(0,160);
  if(!$('s_slug').value)$('s_slug').value=slugify(n);
  seoPrev();dirty();
}
function renderFlavors(){
  const p=S.edit.p,fl=p.flavors||[];
  $('flavors').innerHTML=fl.length?fl.map((f,i)=>`<span class="tag">${esc(f)}<button data-fdel="${i}" aria-label="Quitar ${esc(f)}">✕</button></span>`).join(''):'<p class="hint">Sin sabores.</p>';
  const g=groupOf(p.id);$('flGroup').innerHTML=g?`<div class="card" style="margin-top:14px"><b>🎨 Está en el grupo “${esc(g.nombre)}”</b><p class="hint" style="margin:4px 0 0">${(g.lift_producto_variantes||g.variantes||[]).length} variaciones. Edítalo en la pestaña Variaciones.</p></div>`:'';
}
function addFlavor(){const v=$('flIn').value.trim();if(!v)return;const p=S.edit.p;p.flavors=p.flavors||[];if(!p.flavors.some(x=>norm(x)===norm(v)))p.flavors.push(v);$('flIn').value='';renderFlavors();dirty()}
function renderPhotos(){
  const ph=S.edit.photos;
  $('photos').innerHTML=ph.map((u,i)=>`<div class="ph">${i===0?'<span class="main">Principal</span>':''}<img src="${esc(u)}" alt="" loading="lazy"><div class="phBar">${i>0?`<button data-pm="${i}" title="Hacer principal">★</button><button data-pl="${i}" title="Mover a la izquierda">←</button>`:''}${i<ph.length-1?`<button data-pr="${i}" title="Mover a la derecha">→</button>`:''}<button data-pd="${i}" title="Quitar">✕</button></div></div>`).join('')+(S.edit.uploading?`<div class="ph up">Subiendo ${S.edit.uploading}…</div>`:'');
  dirty();
}
async function uploadFiles(files){
  files=[...files].filter(f=>/^image\//.test(f.type));if(!files.length)return;
  for(const f of files){
    S.edit.uploading=(S.edit.uploading||0)+1;renderPhotos();
    try{
      const blob=await compress(f);
      const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)});
      const j=await fn('lift-catalogo-imagen',{data,type:blob.type,producto_id:S.edit.p.id});
      S.edit.photos.push(j.url);
    }catch(e){toast('No se subió '+short(f.name)+': '+e.message,'err')}
    S.edit.uploading--;renderPhotos();
  }
  toast('Fotos listas. Recuerda guardar.');
}
async function compress(file){
  // Reduce a máx. 1600 px y la convierte a WebP (o JPG si el navegador no soporta WebP).
  const bmp=await (window.createImageBitmap?createImageBitmap(file).catch(()=>null):null);
  let img=bmp;
  if(!img){img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)})}
  const w=img.width,h=img.height,k=Math.min(1,1600/Math.max(w,h));
  const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);
  const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);
  let blob=await new Promise(r=>c.toBlob(r,'image/webp',.86));
  if(!blob||blob.type!=='image/webp')blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.86));
  return blob;
}
async function saveSheet(){
  if(!S.edit)return;readSheet();
  const e=S.edit,p=e.p;
  if(!p.name){tab('general');$('e_name').focus();toast('Escribe el nombre del producto','err');return}
  if(!(p.price>0)){tab('general');$('e_price').focus();toast('Pon un precio mayor a 0','err');return}
  if(e.offer.price&&(e.offer.price>=p.price)){tab('oferta');toast('La oferta debe ser menor al precio normal','err');return}
  if(e.offer.price&&!e.offer.until){tab('oferta');$('o_until').focus();toast('Elige hasta cuándo va la oferta','err');return}
  const btn=$('shSave');btn.disabled=true;btn.firstChild.textContent='Guardando… ';
  try{
    const prodChanged=sig(p)!==e.orig||e.isNew;
    if(prodChanged)await saveProduct(p);
    if(JSON.stringify(e.photos)!==e.photosOrig){
      const extra=e.photos.slice(1);
      await enqueue(()=>rpc('lift_producto_imagenes_guardar',{p_password:pw(),p_producto_id:p.id,p_urls:extra}));
    }
    if(e.out!==e.outOrig)await setOut([p.id],e.out);
    if(JSON.stringify(e.offer)!==e.offerOrig){
      await saveCfg('weekly_offers',m=>{
        if(e.offer.price)m[p.id]={...(m[p.id]||{}),price:e.offer.price,originalPrice:p.price,promoUntil:e.offer.until+'T23:59:59-05:00',note:e.offer.note,gift:!!(m[p.id]&&m[p.id].gift)};
        else delete m[p.id];return m});
    }
    // Actualizar memoria local
    const saved={...p};score(saved);
    if(e.isNew){S.products.unshift(saved);S.rows.push({id:p.id,product:saved,activo:true})}
    else{const i=S.products.findIndex(x=>x.id===p.id);if(i>=0)S.products[i]=saved}
    S.byId.set(p.id,saved);
    e.orig=sig(p);e.outOrig=e.out;e.offerOrig=JSON.stringify(e.offer);e.photosOrig=JSON.stringify(e.photos);
    const wasNew=e.isNew;e.isNew=false;
    toast(wasNew?'Producto creado ✓':'Guardado ✓');
    fillLists();renderInsights();
    if(wasNew)renderProducts();else refreshRow(p.id);
    fillSheet();
  }catch(err){toast('No se guardó: '+err.message,'err')}
  btn.disabled=false;btn.firstChild.textContent='Guardar ';
}
async function closeSheet(force){
  if(!S.edit)return;
  if(!force&&isDirty()&&!(await confirmDlg('¿Salir sin guardar?','Tienes cambios sin guardar en esta ficha.','Salir sin guardar')))return;
  S.edit=null;$('sheet').hidden=true;document.body.style.overflow='';
}
async function deleteProduct(ids){
  ids=[...ids];
  const names=ids.slice(0,3).map(id=>short((S.byId.get(id)||{}).name)).join(', ')+(ids.length>3?' y '+(ids.length-3)+' más':'');
  if(!(await confirmDlg('¿Eliminar '+(ids.length===1?'este producto':ids.length+' productos')+'?',names+'. Dejarán de verse en la tienda.','Eliminar',true)))return false;
  await progress('Eliminando',ids,async id=>{await enqueue(()=>fn('lift-catalog-admin',{action:'delete',id}));S.products=S.products.filter(p=>p.id!==id);S.byId.delete(id);S.sel.delete(id)});
  renderInsights();renderProducts();toast('Eliminado ✓');return true;
}
function duplicate(){
  if(!S.edit)return;readSheet();const src=S.edit.p;
  closeSheet(true).then(()=>{
    openSheet(null,true);const p=S.edit.p;const id=p.id;
    Object.assign(p,JSON.parse(JSON.stringify(src)),{id,name:src.name+' (copia)'});delete p.seo;
    S.edit.photos=src.image?[src.image]:[];
    fillSheet();renderPhotos();toast('Copia lista: cambia lo necesario y guarda');
  });
}

/* ---------- Acciones en lote ---------- */
async function progress(title,items,work){
  $('dlg').hidden=false;$('dlgT').textContent=title+'…';$('dlgB').innerHTML='<div class="prog"><i id="pg"></i></div><p id="pgt"></p>';
  $('dlgOk').hidden=true;$('dlgNo').hidden=true;
  let done=0,fail=0;
  for(const it of items){try{await work(it)}catch(e){fail++;console.warn(e)}done++;$('pg').style.width=(done/items.length*100)+'%';$('pgt').textContent=done+' de '+items.length+(fail?' · '+fail+' con error':'')}
  await sleep(300);$('dlg').hidden=true;$('dlgOk').hidden=false;$('dlgNo').hidden=false;
  if(fail)toast(fail+' no se pudieron guardar','err');
}
function selected(){return [...S.sel].map(id=>S.byId.get(id)).filter(Boolean)}
async function bulk(action){
  const items=selected();if(!items.length&&action!=='clear')return;
  if(action==='clear'){S.sel.clear();renderProducts(true);return}
  if(action==='on'||action==='out'){await setOut(items.map(p=>p.id),action==='out');toast(items.length+' productos: '+(action==='out'?'Agotados':'Disponibles'));renderInsights();renderProducts();return}
  if(action==='del'){await deleteProduct(items.map(p=>p.id));return}
  if(action==='price'){
    const r=await formDlg('Cambiar precio de '+items.length+' productos',`<label class="f"><span>Tipo de cambio</span><select id="bp_mode"><option value="pct">Subir o bajar en %</option><option value="add">Sumar o restar pesos</option><option value="set">Poner un precio fijo</option></select></label><label class="f"><span>Valor (usa - para bajar)</span><input id="bp_val" inputmode="decimal" placeholder="Ej: 5 o -10"></label><label class="f"><span>Redondear a</span><select id="bp_round"><option value="1000">$1.000</option><option value="100">$100</option><option value="1">Sin redondeo</option></select></label><p class="hint" id="bp_prev"></p>`,'Aplicar',()=>{
      const mode=$('bp_mode').value,v=Number(String($('bp_val').value).replace(',','.')),rd=Number($('bp_round').value);
      const calc=p=>{const b=Number(p.price)||0;let n=mode==='pct'?b*(1+v/100):mode==='add'?b+v:v;return Math.max(0,Math.round(n/rd)*rd)};
      const ex=items[0];$('bp_prev').textContent=Number.isFinite(v)&&ex?'Ejemplo: '+short(ex.name)+' '+money(ex.price)+' → '+money(calc(ex)):'';
      return Number.isFinite(v)&&$('bp_val').value!==''?calc:null;
    });
    if(!r)return;
    await progress('Actualizando precios',items,async p=>{const n=r(p);if(n>0&&n!==p.price){p.price=n;score(p);await saveProduct(p)}});
    renderProducts();toast('Precios actualizados ✓');return;
  }
  if(action==='cat'||action==='lab'){
    const isCat=action==='cat',list=isCat?S.cats:S.labs;
    const r=await formDlg((isCat?'Mover a categoría':'Cambiar laboratorio')+' ('+items.length+')',`<label class="f"><span>${isCat?'Categoría':'Laboratorio'}</span><input id="bc_v" list="${isCat?'dlCats':'dlLabs'}" placeholder="Escribe o elige"></label>`,'Aplicar',()=>$('bc_v').value.trim()||null);
    if(!r)return;
    await progress('Guardando',items,async p=>{if(isCat)p.category=r;else p.brand=r;score(p);await saveProduct(p)});
    fillLists();renderProducts();toast('Listo ✓');return;
  }
  if(action==='offer'){
    const r=await formDlg('Oferta para '+items.length+' productos',`<label class="f"><span>Descuento</span><div class="money"><i>%</i><input id="bo_pct" inputmode="numeric" placeholder="Ej: 10"></div></label><label class="f"><span>Vence</span><input id="bo_until" type="date" value="${toDateIn(new Date(Date.now()+7*864e5))}"></label><label class="f"><span>Redondear a</span><select id="bo_round"><option value="1000">$1.000</option><option value="100">$100</option></select></label>`,'Crear ofertas',()=>{const pc=num($('bo_pct').value),u=$('bo_until').value,rd=Number($('bo_round').value);return pc>0&&pc<90&&u?{pc,u,rd}:null});
    if(!r)return;
    await saveCfg('weekly_offers',m=>{items.forEach(p=>{const b=Number(p.price)||0;if(!b)return;m[p.id]={...(m[p.id]||{}),price:Math.round(b*(1-r.pc/100)/r.rd)*r.rd,originalPrice:b,promoUntil:r.u+'T23:59:59-05:00',gift:!!(m[p.id]&&m[p.id].gift),note:(m[p.id]&&m[p.id].note)||''}});return m});
    renderInsights();renderProducts();toast('Ofertas creadas ✓');return;
  }
  if(action==='group'){openGroupCreate(items);return}
}

/* ---------- Ofertas ---------- */
function renderOffers(){
  const all=Object.entries(S.cfg.weekly_offers||{}).map(([id,o])=>({p:S.byId.get(Number(id)),o:offerOf({id:Number(id)}),id:Number(id)})).filter(x=>x.p&&x.o);
  const act=all.filter(x=>!x.o.expired).sort((a,b)=>(a.o.until||0)-(b.o.until||0)),exp=all.filter(x=>x.o.expired);
  const soon=act.filter(x=>x.o.until&&(x.o.until-new Date())<3*864e5).length;
  $('offerStats').innerHTML=`<div class="ins good"><i>🔥</i><b>${act.length}</b><span>Activas</span></div><div class="ins warn"><i>⏳</i><b>${soon}</b><span>Vencen en 3 días</span></div><div class="ins bad"><i>⌛</i><b>${exp.length}</b><span>Vencidas</span></div>`+(exp.length?`<button class="ins" id="offClean"><i>🧹</i><b>Limpiar</b><span>Quitar vencidas</span></button>`:'');
  const card=x=>{const {p,o}=x,base=Number(p.price)||0,pct=base?Math.round((1-o.price/base)*100):0,d=o.until?Math.ceil((o.until-new Date())/864e5):null;
    const cd=o.expired?'<span class="cd exp">Vencida</span>':d==null?'<span class="cd ok">Sin fecha</span>':d<=3?`<span class="cd soon">${d<=0?'Vence hoy':'Vence en '+d+' día'+(d===1?'':'s')}</span>`:`<span class="cd ok">Hasta ${o.until.toLocaleDateString('es-CO',{day:'numeric',month:'short'})}</span>`;
    return `<div class="card oc" data-id="${p.id}">${p.image?`<img class="thumb" src="${esc(p.image)}" alt="" loading="lazy">`:'<div class="thumb empty">📷</div>'}<div><h4>${esc(p.name)}</h4><div class="prices"><b>${money(o.price)}</b><s>${money(base)}</s><span class="pct">-${pct}%</span></div>${cd}</div><div class="acts"><button class="btn" data-oe="${p.id}">Editar</button><button class="btn" data-ox="${p.id}">+7 días</button><button class="btn danger" data-od="${p.id}">Quitar</button></div></div>`};
  $('offerList').innerHTML=(act.length||exp.length)?act.map(card).join('')+exp.map(card).join(''):'<div class="empty"><b>No hay ofertas</b>Usa “Poner oferta” o selecciona productos y toca 🔥 Oferta.</div>';
}

/* ---------- Categorías y laboratorios ---------- */
function renderTiles(kind){
  const isCat=kind==='cat',cfg=(isCat?S.cfg.categories_v1:S.cfg.laboratories_v1)||{},q=norm($(isCat?'catQ':'labQ').value);
  const counts={};S.products.forEach(p=>{const k=isCat?p.category:p.brand;if(k)counts[k]=(counts[k]||0)+1});
  const names=[...new Set([...Object.keys(counts),...Object.keys(cfg).filter(k=>cfg[k]&&!cfg[k].__deleted)])].filter(n=>!q||norm(n).includes(q));
  names.sort((a,b)=>(Number((cfg[a]||{}).order)||999)-(Number((cfg[b]||{}).order)||999)||a.localeCompare(b,'es'));
  $(isCat?'catList':'labList').innerHTML=names.map(n=>{const c=cfg[n]||{},img=!isCat&&c.image;
    return `<button class="tile${c.active===false?' off':''}" data-${kind}="${esc(n)}"><div class="av">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:esc(n.charAt(0).toUpperCase())}</div><div><b>${esc(n)}</b><span>${counts[n]||0} producto${counts[n]===1?'':'s'}${c.active===false?' · oculta':''}</span></div></button>`}).join('')||'<div class="empty"><b>Sin resultados</b></div>';
}
async function editTile(kind,name){
  const isCat=kind==='cat',key=isCat?'categories_v1':'laboratories_v1',cfg=(S.cfg[key]||{})[name]||{},count=S.products.filter(p=>(isCat?p.category:p.brand)===name).length;
  const r=await formDlg(name?(isCat?'Categoría':'Laboratorio'):(isCat?'Nueva categoría':'Nuevo laboratorio'),
    `<label class="f"><span>Nombre</span><input id="t_name" value="${esc(name||'')}"></label>`+
    (isCat?'':`<label class="f"><span>Logo</span><div class="row" style="margin:0"><input id="t_img" type="url" value="${esc(cfg.image||'')}" placeholder="URL del logo"><label class="btn" style="position:relative">📷 Subir<input type="file" id="t_file" accept="image/*" style="position:absolute;inset:0;opacity:0"></label></div></label>`)+
    `<label class="f" style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="t_on" style="width:20px;height:20px" ${cfg.active===false?'':'checked'}><span style="margin:0">Visible en la tienda</span></label>`+
    (name?`<p class="hint">${count} producto${count===1?'':'s'} usan ${isCat?'esta categoría':'este laboratorio'}.${count?' Si cambias el nombre se actualizan todos.':''}</p>`+(count?'':`<button class="btn danger ghost" id="t_del" type="button">Eliminar</button>`):''),
    'Guardar',()=>({name:$('t_name').value.trim(),img:isCat?null:$('t_img').value.trim(),on:$('t_on').checked}),
    ()=>{const f=$('t_file');if(f)f.onchange=async()=>{const file=f.files[0];if(!file)return;try{const blob=await compress(file);const data=await new Promise(res=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.readAsDataURL(blob)});const j=await fn('lift-catalogo-imagen',{data,type:blob.type,producto_id:'lab'});$('t_img').value=j.url;toast('Logo subido')}catch(e){toast(e.message,'err')}};
      const d=$('t_del');if(d)d.onclick=async()=>{$('dlg').hidden=true;await saveCfg(key,m=>{m[name]={...(m[name]||{}),active:false,__deleted:true};return m});fillLists();renderTiles(kind);toast('Eliminado ✓');dlgResolve&&dlgResolve(null)}});
  if(!r||!r.name)return;
  const renamed=name&&r.name!==name;
  if(renamed&&(S.cats.concat(S.labs)).includes(r.name)&&!(await confirmDlg('Ya existe “'+r.name+'”','Los productos se unirán con los que ya tiene.','Unir')))return;
  await saveCfg(key,m=>{const prev=m[name]||{};const n={...(m[r.name]||{}),...prev,active:r.on};delete n.__deleted;if(!isCat)n.image=r.img||'';if(renamed)m[name]={...prev,active:false,__deleted:true};m[r.name]=n;return m});
  if(renamed){const items=S.products.filter(p=>(isCat?p.category:p.brand)===name);await progress('Actualizando productos',items,async p=>{if(isCat)p.category=r.name;else p.brand=r.name;await saveProduct(p)})}
  fillLists();renderTiles(kind);toast('Guardado ✓');
}

/* ---------- Variaciones ---------- */
async function loadGroups(force){
  if(S.groups&&!force)return S.groups;
  $('grpList').innerHTML='<div class="skel"></div><div class="skel"></div>';
  try{const j=await fn('lift-catalog-admin',{action:'variant-groups'});S.groups=j.grupos||[]}
  catch(e){S.groups=[];toast('No pude cargar los grupos: '+e.message,'err')}
  return S.groups;
}
function groupOf(pid){return (S.groups||[]).find(g=>(g.lift_producto_variantes||[]).some(v=>Number(v.producto_id)===pid))}
async function renderGroups(){
  await loadGroups();const q=norm($('grpQ').value);
  const gs=S.groups.filter(g=>!q||norm([g.nombre,g.marca,g.categoria].join(' ')).includes(q));
  $('grpList').innerHTML=gs.map(g=>{const vs=(g.lift_producto_variantes||[]).sort((a,b)=>a.orden-b.orden);
    return `<div class="card gc"><h4>${esc(g.nombre||'Sin nombre')}</h4><p class="hint" style="margin:0">${esc([g.marca,g.presentacion,g.categoria].filter(Boolean).join(' · '))} · ${money(g.precio)}${g.visible_publico===false?' · oculto':''}</p>
      <div class="vs">${vs.map(v=>{const p=S.byId.get(Number(v.producto_id));const img=v.imagen||(p&&p.image);return `<span class="v">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:''}${esc(v.sabor||'—')}${v.precio?' · '+money(v.precio):''}</span>`}).join('')}</div>
      <div class="acts"><button class="btn" data-ge="${g.id}">Editar</button><button class="btn danger" data-gd="${g.id}">Desagrupar</button></div></div>`}).join('')||'<div class="empty"><b>No hay grupos</b>Selecciona 2 o más productos en Productos y toca 🎨 Agrupar.</div>';
}
async function openGroupCreate(items){
  if(items.length<2){toast('Selecciona al menos 2 productos en Productos','err');go('productos');return}
  const base=items[0];
  const r=await formDlg('Agrupar '+items.length+' productos',
    `<label class="f"><span>Nombre de la ficha</span><input id="g_name" value="${esc(String(base.name||'').replace(/\s+(vainilla|chocolate|fresa|cookies.*|sin sabor)$/i,''))}"></label>
     <div class="two"><label class="f"><span>Laboratorio</span><input id="g_brand" list="dlLabs" value="${esc(base.brand||'')}"></label><label class="f"><span>Precio base</span><div class="money"><i>$</i><input id="g_price" inputmode="numeric" value="${fmtIn(base.price)}"></div></label></div>
     <p class="hint" style="margin-top:4px">Nombre de cada variación:</p>`+items.map((p,i)=>`<label class="f"><span>${esc(short(p.name))}</span><input data-gv="${p.id}" value="${esc(p.flavor||(p.flavors||[])[0]||'Opción '+(i+1))}"></label>`).join(''),
    'Crear grupo',()=>({nombre:$('g_name').value.trim(),marca:$('g_brand').value.trim(),precio:num($('g_price').value)}));
  if(!r||!r.nombre)return;
  try{
    await enqueue(()=>fn('lift-catalog-admin',{action:'merge-variants',product_ids:items.map(p=>p.id),group:{...r,presentacion:base.presentation||'',imagen:base.image||'',categoria:base.category||'',visible_publico:true},
      variants:items.map(p=>({producto_id:p.id,sabor:(document.querySelector('[data-gv="'+p.id+'"]')||{}).value||p.name,imagen:p.image||'',precio:Number(p.price)||null}))}));
    toast('Grupo creado ✓');S.sel.clear();updateSelAll();await loadGroups(true);go('variaciones');
  }catch(e){toast('No se creó: '+e.message,'err')}
}
async function editGroup(id){
  const g=S.groups.find(x=>x.id===id);if(!g)return;
  const r=await formDlg('Editar grupo',`<label class="f"><span>Nombre</span><input id="ge_n" value="${esc(g.nombre||'')}"></label><div class="two"><label class="f"><span>Laboratorio</span><input id="ge_b" list="dlLabs" value="${esc(g.marca||'')}"></label><label class="f"><span>Precio base</span><div class="money"><i>$</i><input id="ge_p" inputmode="numeric" value="${fmtIn(g.precio)}"></div></label></div><label class="f"><span>Categoría</span><input id="ge_c" list="dlCats" value="${esc(g.categoria||'')}"></label><label class="f" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="ge_v" style="width:20px;height:20px" ${g.visible_publico===false?'':'checked'}><span style="margin:0">Visible en la tienda</span></label>`,
    'Guardar',()=>({nombre:$('ge_n').value.trim(),marca:$('ge_b').value.trim(),precio:num($('ge_p').value),categoria:$('ge_c').value.trim(),visible_publico:$('ge_v').checked}));
  if(!r)return;
  try{await enqueue(()=>fn('lift-catalog-admin',{action:'update-variant-group',id,group:r}));Object.assign(g,r);renderGroups();toast('Grupo guardado ✓')}catch(e){toast(e.message,'err')}
}

/* ---------- Excel (CSV) ---------- */
const COLS=['id','nombre','laboratorio','categoria','presentacion','precio','precio_entrenador','estado','oferta','oferta_hasta','imagen'];
function exportCSV(list){
  const q=v=>{v=String(v==null?'':v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const lines=[COLS.join(';')].concat(list.map(p=>{const o=offerOf(p);return [p.id,p.name,p.brand,p.category,p.presentation,p.price||'',p.trainerPrice||'',isOut(p)?'agotado':'disponible',o&&!o.expired?o.price:'',o&&o.until?toDateIn(o.until):'',p.image].map(q).join(';')}));
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='catalogo-supgo-'+toDateIn(new Date())+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  toast(list.length+' productos descargados');
}
function parseCSV(text){
  text=text.replace(/^﻿/,'');const first=text.split(/\r?\n/)[0]||'';const sep=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===sep){row.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}else f+=c}
  if(f||row.length){row.push(f);rows.push(row)}
  const head=rows.shift().map(h=>norm(h).replace(/\s+/g,'_'));
  return rows.filter(r=>r.some(x=>x.trim())).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||'').trim()])));
}
function importCSV(file){
  const rd=new FileReader();rd.onload=()=>{
    let data;try{data=parseCSV(String(rd.result))}catch(e){toast('No pude leer el archivo','err');return}
    const changes=[];
    data.forEach(r=>{const id=Number(r.id),p=S.byId.get(id);if(!p)return;const ch={};
      if(r.nombre&&r.nombre!==p.name)ch.name=[p.name,r.nombre];
      if(r.laboratorio!==undefined&&r.laboratorio&&r.laboratorio!==p.brand)ch.brand=[p.brand,r.laboratorio];
      if(r.categoria!==undefined&&r.categoria&&r.categoria!==p.category)ch.category=[p.category,r.categoria];
      if(r.precio!==undefined&&num(r.precio)>0&&num(r.precio)!==Number(p.price))ch.price=[p.price,num(r.precio)];
      if(r.precio_entrenador!==undefined&&num(r.precio_entrenador)!==Number(p.trainerPrice||0))ch.trainerPrice=[p.trainerPrice||0,num(r.precio_entrenador)];
      if(r.estado){const out=/agot/i.test(r.estado);if(out!==isOut(p))ch.out=[isOut(p)?'agotado':'disponible',out?'agotado':'disponible']}
      if(Object.keys(ch).length)changes.push({p,ch});
    });
    const L={name:'Nombre',brand:'Laboratorio',category:'Categoría',price:'Precio',trainerPrice:'P. entrenador',out:'Estado'};
    const fmt=(k,v)=>k==='price'||k==='trainerPrice'?money(v):esc(v||'—');
    $('impPreview').innerHTML=changes.length?`<div class="panel"><h3>${changes.length} producto${changes.length===1?'':'s'} con cambios</h3><p>Revisa antes de aplicar. Las filas sin cambios o con ID desconocido se ignoran (${data.length-changes.length}).</p>
      <div style="overflow:auto;max-height:50vh"><table class="diff"><tr><th>Producto</th><th>Cambio</th></tr>${changes.map(c=>`<tr><td>${esc(short(c.p.name))}<br><small style="color:#6b736c">ID ${c.p.id}</small></td><td>${Object.entries(c.ch).map(([k,[a,b]])=>`${L[k]}: <del>${fmt(k,a)}</del> → <ins>${fmt(k,b)}</ins>`).join('<br>')}</td></tr>`).join('')}</table></div>
      <div class="row" style="margin-top:12px"><button class="btn primary" id="impApply">Aplicar ${changes.length} cambios</button><button class="btn" id="impCancel">Cancelar</button></div></div>`
      :'<div class="panel"><h3>Sin cambios</h3><p>El archivo coincide con el catálogo actual.</p></div>';
    const ap=$('impApply');if(ap)ap.onclick=async()=>{
      const outOn=[],outOff=[];
      await progress('Aplicando cambios',changes,async({p,ch})=>{
        if(ch.out){(ch.out[1]==='agotado'?outOn:outOff).push(p.id)}
        const keys=Object.keys(ch).filter(k=>k!=='out');if(!keys.length)return;
        keys.forEach(k=>{if(k==='trainerPrice'&&!ch[k][1])delete p.trainerPrice;else p[k]=ch[k][1]});score(p);await saveProduct(p);
      });
      if(outOn.length)await setOut(outOn,true);if(outOff.length)await setOut(outOff,false);
      $('impPreview').innerHTML='';fillLists();renderInsights();toast('Cambios aplicados ✓');
    };
    const cc=$('impCancel');if(cc)cc.onclick=()=>{$('impPreview').innerHTML=''};
  };rd.readAsText(file,'utf-8');
}

/* ---------- Búsqueda global ---------- */
let cmdIdx=0,cmdRes=[];
function openCmd(){$('cmdk').hidden=false;$('cmdkIn').value='';cmdSearch();setTimeout(()=>$('cmdkIn').focus(),30)}
function closeCmd(){$('cmdk').hidden=true}
function cmdSearch(){
  const q=norm($('cmdkIn').value).split(/\s+/).filter(Boolean);
  cmdRes=(q.length?S.products.filter(p=>q.every(w=>p._q.includes(w))):S.products.slice().sort((a,b)=>b.id-a.id)).slice(0,30);cmdIdx=0;
  $('cmdkRes').innerHTML=cmdRes.map((p,i)=>`<button class="cr${i===0?' on':''}" data-i="${i}">${p.image?`<img class="thumb" src="${esc(p.image)}" alt="" loading="lazy">`:'<div class="thumb empty">📷</div>'}<div style="min-width:0"><b>${esc(p.name)}</b><span>${esc([p.brand,p.category].filter(Boolean).join(' · '))} · ID ${p.id}</span></div><em>${money(p.price)}</em></button>`).join('')||'<div class="empty">Sin resultados</div>';
}
function cmdMove(d){if(!cmdRes.length)return;cmdIdx=(cmdIdx+d+cmdRes.length)%cmdRes.length;[...$('cmdkRes').children].forEach((b,i)=>b.classList.toggle('on',i===cmdIdx));$('cmdkRes').children[cmdIdx].scrollIntoView({block:'nearest'})}

/* ---------- Diálogos y avisos ---------- */
let dlgResolve=null;
function formDlg(title,html,ok,read,after){
  return new Promise(res=>{
    $('dlgT').textContent=title;$('dlgB').innerHTML=html;$('dlgOk').textContent=ok||'Aceptar';$('dlgOk').className='btn primary';$('dlg').hidden=false;
    const inputs=$('dlgB').querySelectorAll('input,select');if(inputs[0])setTimeout(()=>inputs[0].focus(),50);
    $('dlgB').oninput=()=>{try{read()}catch(e){}};
    dlgResolve=v=>{dlgResolve=null;$('dlg').hidden=true;$('dlgB').oninput=null;res(v)};
    $('dlgOk').onclick=()=>{const v=read();if(v==null){toast('Revisa los datos','err');return}dlgResolve(v)};
    $('dlgNo').onclick=()=>dlgResolve(null);
    $('dlgB').onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();$('dlgOk').click()}};
    if(after)after();
  });
}
function confirmDlg(title,text,ok,danger){
  return new Promise(res=>{
    $('dlgT').textContent=title;$('dlgB').innerHTML='<p>'+esc(text)+'</p>';$('dlgOk').textContent=ok||'Aceptar';$('dlgOk').className='btn primary'+(danger?' danger':'');
    if(danger){$('dlgOk').style.background='#c62828';$('dlgOk').style.borderColor='#c62828';$('dlgOk').style.color='#fff'}else{$('dlgOk').style.cssText=''}
    $('dlg').hidden=false;
    dlgResolve=v=>{dlgResolve=null;$('dlg').hidden=true;$('dlgOk').style.cssText='';res(v)};
    $('dlgOk').onclick=()=>dlgResolve(true);$('dlgNo').onclick=()=>dlgResolve(false);
  });
}
function toast(msg,kind,undo){
  const t=document.createElement('div');t.className='toast'+(kind==='err'?' err':'');t.innerHTML='<span>'+esc(msg)+'</span>'+(undo?'<button>Deshacer</button>':'');
  if(undo)t.querySelector('button').onclick=()=>{t.remove();undo()};
  $('toasts').appendChild(t);while($('toasts').children.length>3)$('toasts').firstChild.remove();
  setTimeout(()=>t.remove(),undo?6000:3200);
}

/* ---------- Navegación ---------- */
const SECTIONS=['productos','ofertas','categorias','laboratorios','variaciones','excel'];
function go(s){if(location.hash!=='#'+s)location.hash=s;else renderSection()}
function renderSection(){
  let s=decodeURIComponent(location.hash.slice(1));
  // Atajos desde CONTROL: #nuevo abre la ficha vacía, #combos filtra los combos.
  if(s==='nuevo'||s==='combos'){
    if(s==='combos'){S.filters.flags=new Set(['combo'])}else S.wantNew=true;
    history.replaceState(null,'','#productos');s='productos';
  }
  if(!SECTIONS.includes(s))s='productos';S.section=s;
  SECTIONS.forEach(x=>{$('s-'+x).hidden=x!==s});
  [...$('tabs').children].forEach(a=>a.classList.toggle('on',a.dataset.s===s));
  const onTab=document.querySelector('#tabs a.on');if(onTab)onTab.scrollIntoView({block:'nearest',inline:'center'});
  if(!S.products.length)return;
  if(s==='productos'){renderInsights();renderProducts()}
  if(s==='ofertas')renderOffers();
  if(s==='categorias')renderTiles('cat');
  if(s==='laboratorios')renderTiles('lab');
  if(s==='variaciones')renderGroups();
  if(s!=='productos')$('bulk').hidden=true;else updateSelAll();
  if(S.wantNew){S.wantNew=false;if(!S.edit)openSheet(null,true)}
}

/* ---------- Eventos ---------- */
function bind(){
  window.addEventListener('hashchange',renderSection);
  $('openSearch').onclick=openCmd;$('newProduct').onclick=()=>openSheet(null,true);$('fab').onclick=()=>openSheet(null,true);
  document.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
    if(mod&&k==='k'){e.preventDefault();openCmd();return}
    if(mod&&k==='s'&&S.edit){e.preventDefault();saveSheet();return}
    if(k==='escape'){if(!$('cmdk').hidden)closeCmd();else if(!$('dlg').hidden&&dlgResolve)dlgResolve(null);else if(S.edit)closeSheet();return}
    const typing=/input|textarea|select/i.test(document.activeElement.tagName);
    if(!typing&&!S.edit&&$('cmdk').hidden){if(k==='/'){e.preventDefault();$('q').focus()}if(k==='n'&&!mod){e.preventDefault();openSheet(null,true)}}
  });
  // Filtros
  $('insights').onclick=e=>{const b=e.target.closest('[data-flag]');if(!b)return;const k=b.dataset.flag;if(k==='all')S.filters.flags.clear();else if(S.filters.flags.has(k))S.filters.flags.delete(k);else S.filters.flags.add(k);renderInsights();renderProducts()};
  $('q').oninput=debounce(()=>{S.filters.q=$('q').value;renderProducts()},160);
  $('fCat').onchange=()=>{S.filters.cat=$('fCat').value;renderProducts()};
  $('fLab').onchange=()=>{S.filters.lab=$('fLab').value;renderProducts()};
  $('fSort').onchange=()=>{S.filters.sort=$('fSort').value;renderProducts()};
  $('viewSeg').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.view=b.dataset.v;try{localStorage.setItem(VIEWK,S.view)}catch(x){}renderProducts()};
  $('clearFilters').onclick=()=>{S.filters={flags:new Set(),cat:'',lab:'',q:'',sort:S.filters.sort};$('q').value='';$('fCat').value='';$('fLab').value='';renderInsights();renderProducts()};
  $('selAll').onchange=()=>{const on=$('selAll').checked;S.list.forEach(p=>on?S.sel.add(p.id):S.sel.delete(p.id));renderProducts(true)};
  // Lista
  const pl=$('plist');
  pl.addEventListener('click',e=>{
    const row=e.target.closest('.pr');if(!row)return;const id=Number(row.dataset.id);
    if(e.target.closest('[data-sw]')){quickStatus(id);return}
    if(e.target.closest('[data-open]')){openSheet(id);return}
  });
  pl.addEventListener('change',e=>{if(e.target.matches('[data-sel]')){const row=e.target.closest('.pr'),id=Number(row.dataset.id);if(e.target.checked)S.sel.add(id);else S.sel.delete(id);row.classList.toggle('sel',e.target.checked);updateSelAll()}});
  pl.addEventListener('keydown',e=>{if(e.target.matches('[data-price]')&&e.key==='Enter'){e.preventDefault();e.target.blur()}});
  pl.addEventListener('focusout',e=>{if(e.target.matches('[data-price]'))quickPrice(Number(e.target.closest('.pr').dataset.id),e.target)});
  pl.addEventListener('input',e=>{if(e.target.matches('[data-price]')){const v=num(e.target.value);e.target.value=v?v.toLocaleString('es-CO'):''}});
  new IntersectionObserver(es=>{if(es[0].isIntersecting&&S.section==='productos'&&S.shown<S.list.length)renderProducts(false)},{rootMargin:'600px'}).observe($('more'));
  $('bulk').onclick=e=>{const b=e.target.closest('[data-b]');if(b)bulk(b.dataset.b)};
  // Ficha
  $('sheet').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeSheet()});
  $('shTabs').onclick=e=>{const b=e.target.closest('button');if(b)tab(b.dataset.t)};
  $('shScore').onclick=e=>{const b=e.target.closest('[data-tip]');if(b)tab(b.dataset.tip)};
  $('shBody').addEventListener('input',e=>{
    if(e.target.matches('#e_price,#e_trainer,#o_price')){const v=num(e.target.value);e.target.value=v?v.toLocaleString('es-CO'):''}
    if(e.target.id==='e_description')descCount();
    if(/^(o_|e_price)/.test(e.target.id))offerInfo();
    if(/^(s_|e_name)/.test(e.target.id))seoPrev();
    dirty();
  });
  $('e_status').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.edit.out=b.dataset.v==='out';statusSeg();dirty()};
  $('o_quick').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=new Date();if(b.dataset.d==='eom'){d.setMonth(d.getMonth()+1,0)}else d.setDate(d.getDate()+Number(b.dataset.d));$('o_until').value=toDateIn(d);offerInfo();dirty()};
  $('o_pct').onclick=e=>{const b=e.target.closest('button');if(!b)return;const base=num($('e_price').value);if(!base){toast('Primero pon el precio normal','err');return}$('o_price').value=(Math.round(base*(1-b.dataset.p/100)/1000)*1000).toLocaleString('es-CO');if(!$('o_until').value){const d=new Date();d.setDate(d.getDate()+7);$('o_until').value=toDateIn(d)}offerInfo();dirty()};
  $('o_remove').onclick=()=>{$('o_price').value='';$('o_until').value='';$('o_note').value='';offerInfo();dirty()};
  $('s_auto').onclick=()=>{$('s_slug').value=slugify($('e_name').value);seoPrev();dirty()};
  $('s_fill').onclick=autoSeo;
  $('flAdd').onclick=addFlavor;$('flIn').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addFlavor()}};
  $('flavors').onclick=e=>{const b=e.target.closest('[data-fdel]');if(!b)return;S.edit.p.flavors.splice(Number(b.dataset.fdel),1);renderFlavors();dirty()};
  $('photos').onclick=e=>{const b=e.target.closest('button');if(!b)return;const ph=S.edit.photos;const i=Number(b.dataset.pm??b.dataset.pl??b.dataset.pr??b.dataset.pd);
    if(b.dataset.pm!=null){ph.unshift(ph.splice(i,1)[0])}else if(b.dataset.pl!=null){[ph[i-1],ph[i]]=[ph[i],ph[i-1]]}else if(b.dataset.pr!=null){[ph[i+1],ph[i]]=[ph[i],ph[i+1]]}else if(b.dataset.pd!=null){ph.splice(i,1)}renderPhotos()};
  $('phFile').onchange=e=>{uploadFiles(e.target.files);e.target.value=''};
  const drop=$('phDrop');['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over')}));drop.addEventListener('drop',e=>uploadFiles(e.dataTransfer.files));
  $('phAddUrl').onclick=()=>{const u=$('phUrl').value.trim();if(!/^https?:\/\//.test(u)){toast('Pega una URL que empiece por https://','err');return}S.edit.photos.push(u);$('phUrl').value='';renderPhotos()};
  $('shSave').onclick=saveSheet;
  $('shDel').onclick=async()=>{if(await deleteProduct([S.edit.p.id]))closeSheet(true)};
  $('shDup').onclick=duplicate;
  // Búsqueda global
  $('cmdkIn').oninput=debounce(cmdSearch,80);
  $('cmdkIn').onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();cmdMove(1)}else if(e.key==='ArrowUp'){e.preventDefault();cmdMove(-1)}else if(e.key==='Enter'){const p=cmdRes[cmdIdx];if(p){closeCmd();if(S.section!=='productos')go('productos');openSheet(p.id)}}};
  $('cmdkRes').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;const p=cmdRes[Number(b.dataset.i)];closeCmd();openSheet(p.id)};
  $('cmdk').addEventListener('click',e=>{if(e.target.closest('[data-cclose]'))closeCmd()});
  // Ofertas
  $('offerAdd').onclick=()=>{openCmd();toast('Elige el producto y ve a la pestaña Oferta')};
  $('offerList').onclick=async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.oe){openSheet(Number(b.dataset.oe));tab('oferta');return}
    if(b.dataset.ox){const id=b.dataset.ox;await saveCfg('weekly_offers',m=>{if(m[id]){const base=m[id].promoUntil&&new Date(m[id].promoUntil)>new Date()?new Date(m[id].promoUntil):new Date();base.setDate(base.getDate()+7);m[id].promoUntil=toDateIn(base)+'T23:59:59-05:00'}return m});renderOffers();toast('Oferta extendida 7 días ✓');return}
    if(b.dataset.od){const id=b.dataset.od;if(!(await confirmDlg('¿Quitar esta oferta?','Vuelve al precio normal de inmediato.','Quitar',true)))return;await saveCfg('weekly_offers',m=>{delete m[id];return m});renderOffers();toast('Oferta quitada ✓')}
  };
  $('offerStats').onclick=async e=>{if(!e.target.closest('#offClean'))return;if(!(await confirmDlg('¿Quitar las ofertas vencidas?','Ya no se muestran en la tienda; esto solo limpia la lista.','Quitar')))return;await saveCfg('weekly_offers',m=>{Object.keys(m).forEach(k=>{if(m[k].promoUntil&&new Date(m[k].promoUntil)<new Date())delete m[k]});return m});renderOffers();toast('Lista limpia ✓')};
  // Categorías y laboratorios
  $('catQ').oninput=debounce(()=>renderTiles('cat'),120);$('labQ').oninput=debounce(()=>renderTiles('lab'),120);
  $('catList').onclick=e=>{const b=e.target.closest('[data-cat]');if(b)editTile('cat',b.dataset.cat)};
  $('labList').onclick=e=>{const b=e.target.closest('[data-lab]');if(b)editTile('lab',b.dataset.lab)};
  $('catAdd').onclick=()=>editTile('cat','');$('labAdd').onclick=()=>editTile('lab','');
  // Variaciones
  $('grpQ').oninput=debounce(renderGroups,120);
  $('grpAdd').onclick=()=>openGroupCreate(selected());
  $('grpList').onclick=async e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.ge)editGroup(Number(b.dataset.ge));
    if(b.dataset.gd){if(!(await confirmDlg('¿Desagrupar?','Los productos siguen existiendo por separado; solo se elimina la ficha que los une.','Desagrupar',true)))return;try{await enqueue(()=>fn('lift-catalog-admin',{action:'delete-variant-group',id:Number(b.dataset.gd)}));await loadGroups(true);renderGroups();toast('Grupo eliminado ✓')}catch(x){toast(x.message,'err')}}
  };
  // Excel
  $('expAll').onclick=()=>exportCSV(S.products);$('expFiltered').onclick=()=>exportCSV(applyFilters());
  $('impFile').onchange=e=>{const f=e.target.files[0];if(f)importCSV(f);e.target.value=''};
  const idrop=$('impDrop');['dragenter','dragover'].forEach(ev=>idrop.addEventListener(ev,e=>{e.preventDefault();idrop.classList.add('over')}));['dragleave','drop'].forEach(ev=>idrop.addEventListener(ev,e=>{e.preventDefault();idrop.classList.remove('over')}));idrop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)importCSV(f)});
  window.addEventListener('beforeunload',e=>{if(S.edit&&isDirty()||pending){e.preventDefault();e.returnValue=''}});
}

/* ---------- Acceso ---------- */
function lockScreen(msg){$('lock').hidden=false;$('lockErr').textContent=msg||'';setTimeout(()=>$('lockPw').focus(),50)}
async function unlock(e){
  e.preventDefault();const v=$('lockPw').value;if(!v)return;$('lockErr').textContent='Verificando…';
  try{
    const r=await fetch(SB+'/functions/v1/lift-catalog-admin',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({password:v,action:'variant-groups'})});
    if(r.status===401){$('lockErr').textContent='Clave incorrecta';return}
    const j=await r.json();S.groups=j.grupos||null;
    try{sessionStorage.setItem(PASS,v);sessionStorage.setItem('liftAdminUnlockedV1','1')}catch(x){}
    $('lock').hidden=true;if(!S.products.length)load();
  }catch(x){$('lockErr').textContent='Sin conexión. Intenta de nuevo.'}
}

try{if(window.top!==window)document.documentElement.classList.add('embedded')}catch(e){document.documentElement.classList.add('embedded')}
bind();
$('fToggle').onclick=()=>{const t=$('fToggle').parentElement;t.classList.toggle('open')};
$('lockForm').onsubmit=unlock;
if(!pw())lockScreen();else{load();loadGroups().catch(()=>{})}
})();

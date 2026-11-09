/* SUPGO · Mejoras de las herramientas de Catálogo del administrador (admin.html).
   Capa visual y de usabilidad sobre el panel "laf" existente: no cambia cómo se
   guardan los datos, solo cómo se ven y se usan las herramientas.
   - Pestañas claras con iconos, fijas arriba y visibles en celular.
   - Productos: filtros rápidos, búsqueda sin trabas, selección múltiple bajo demanda,
     guardar con Enter, aviso de cambios sin guardar y fotos plegables en celular.
   - Ofertas, combos y categorías: filas y tarjetas que no se cortan en celular.
   - Crear producto: barra de guardar siempre visible.
   - Laboratorios: lista propia con buscar, crear, editar, duplicar y eliminar.
   - Variaciones: atajo para seleccionar los productos a agrupar. */
(function(){
'use strict';
if(window.__supgoCatalogoAdmin)return;window.__supgoCatalogoAdmin=true;

var CSS=`
#lafPanel .scaUp{display:inline-flex;align-items:center;margin-top:6px;height:30px;padding:0 12px;border-radius:999px;border:1px solid #a9d12f;background:#c8f34b;color:#111;font:700 12px Poppins,Arial,sans-serif;cursor:pointer;white-space:nowrap}#lafPanel .scaUp:disabled{opacity:.7}
#lafPanel .scaUp.ok{background:#15803d;color:#fff;border-color:#15803d}
#lafPanel .lafRow.scaNoImg > img{visibility:visible!important;background:#f4f6f4 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a8a3' stroke-width='1.6'%3E%3Crect x='3' y='5' width='18' height='14' rx='2'/%3E%3Ccircle cx='9' cy='10' r='1.6'/%3E%3Cpath d='m21 16-5-5-8 8'/%3E%3C/svg%3E") center/55% no-repeat;border-radius:8px}
#lafPanel .lafRow.scaDrop{outline:2px dashed #15803d;outline-offset:-2px;background:#f0fbe6}
#lafPanel{--c-ink:#111;--c-muted:#6b6f6b;--c-line:#e4e7e4;--c-soft:#f4f6f4;--c-green:#15803d;--c-lime:#c8f34b;font-family:Poppins,system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
#lafPanel .lafBody{background:var(--c-soft)}
/* Pestañas */
#lafPanel .lafTabs{position:sticky;top:0;z-index:5;gap:6px;padding:10px 14px;background:#fff;scrollbar-width:none;scroll-behavior:smooth}
#lafPanel .lafTabs::-webkit-scrollbar{display:none}
#lafPanel .lafTab{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border:1px solid var(--c-line);border-radius:999px;font:600 12.5px Poppins,Arial,sans-serif;color:var(--c-ink);background:#fff;transition:background .15s,border-color .15s}
#lafPanel .lafTab:hover{border-color:#bfc4bf}
#lafPanel .lafTab.on{background:var(--c-ink);border-color:var(--c-ink);color:#fff}
#lafPanel .lafTab .ti{font-size:14px;line-height:1}
/* Tarjetas y textos */
#lafPanel .lafBox{background:#fff;border:1px solid var(--c-line);border-radius:16px;padding:16px}
#lafPanel .lafBox h3{font-size:17px;letter-spacing:-.01em;margin:0 0 10px}
#lafPanel .lafNote{font-size:12.5px;color:#4b4f4b;background:#fff;border:1px solid var(--c-line);border-radius:12px}
#lafPanel .lafBtn{min-height:42px;border-radius:11px;font:600 12.5px Poppins,Arial,sans-serif;padding:0 14px}
#lafPanel .lafInput,#lafPanel .lafSelect{height:46px;border-radius:12px;border-color:#d9ddd9;font-size:14px}
#lafPanel .lafInput:focus,#lafPanel .lafSelect:focus{outline:none;border-color:var(--c-ink);box-shadow:0 0 0 3px rgba(17,17,17,.08)}
/* Productos: barra de herramientas */
#laf-products .lafTools{position:sticky;top:0;z-index:4;background:var(--c-soft);padding:2px 0 8px;margin-bottom:6px}
#laf-products #lafStatusFilter{display:none}
.scaChips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;width:100%}
.scaChips::-webkit-scrollbar{display:none}
.scaChips button{flex:none;height:34px;padding:0 12px;border:1px solid var(--c-line);border-radius:999px;background:#fff;font:500 12.5px Poppins,Arial,sans-serif;cursor:pointer;color:var(--c-ink)}
.scaChips button.on{background:var(--c-ink);color:#fff;border-color:var(--c-ink)}
.scaChips .scaBulkToggle{margin-left:auto}
.scaChips .scaBulkToggle.on{background:var(--c-lime);color:var(--c-ink);border-color:#a9d12f}
#laf-products .lafCount{font-size:12px;color:var(--c-muted);margin:2px 2px 8px}
/* Selección múltiple: oculta hasta que se pide */
#laf-products:not(.scaBulkOn) .lafBulkTools,#laf-products:not(.scaBulkOn) #lafBulkStatus:empty{display:none!important}
#laf-products:not(.scaBulkOn) .lafBulkCheckWrap{display:none!important}
#laf-products.scaBulkOn .lafBulkTools{position:sticky;bottom:0;z-index:4;display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,.08);margin:0 0 10px}
/* Productos: filas */
#lafProductList{gap:10px}
#lafProductList .lafRow{background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:10px;gap:10px}
#laf-products:not(.scaBulkOn) #lafProductList .lafBulkRow{grid-template-columns:52px minmax(140px,1fr) minmax(280px,1.5fr) auto!important}
#lafProductList .lafRow>img{width:52px;height:52px;border-radius:10px;background:var(--c-soft);object-fit:contain}
#lafProductList .lafName{font-size:13.5px;font-weight:600;line-height:1.3}
#lafProductList .lafMeta{font-size:11.5px;color:var(--c-muted)}
#lafProductList .liftInlineFields input{height:42px!important;border-radius:10px!important;font-size:13px!important}
#lafProductList .liftInlineFields input.lafPrice{font-weight:600;font-size:14px!important}
#lafProductList .lafIcon{width:42px;height:42px;border-radius:11px;border:1px solid var(--c-line);background:#fff;font-size:16px;cursor:pointer}
#lafProductList .lafRow.scaDirty{border-color:#a9d12f;box-shadow:0 0 0 2px rgba(200,243,75,.5)}
#lafProductList .lafRow.scaDirty .scaSave{background:var(--c-ink);color:#fff;border-color:var(--c-ink)}
#lafProductList .lafRow.scaSaved{border-color:#86c79a}
.scaPhotos{display:none}
.scaMore{font-size:12px;color:var(--c-muted);text-align:center;padding:10px}
/* Crear producto: guardar siempre visible */
#laf-create .lafTools.scaSaveBar{position:sticky;bottom:-28px;z-index:4;background:#fff;border-top:1px solid var(--c-line);margin:14px -16px -16px!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-radius:0 0 16px 16px;box-shadow:0 -10px 24px rgba(0,0,0,.06)}
#laf-create .lafTools.scaSaveBar .lafBtn.primary{flex:1;min-height:48px;font-size:14px}
/* Ofertas */
#lafOfferList{display:grid;gap:8px}
#lafPanel .lafOfferRow{background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:10px 12px;gap:8px;align-items:center}
#lafPanel .lafOfferRow b{font-size:13px!important}
/* Categorías y laboratorios: tarjetas */
#lafCategoryList,.scaLabList{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(170px,1fr))!important;gap:10px!important}
#lafPanel .liftCatPanelCard,.scaLabCard{position:relative;display:flex!important;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;gap:4px;background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:14px 10px 12px!important;min-height:0!important}
#lafPanel .liftCatPanelActions,.scaLabActions{position:static!important;display:flex!important;justify-content:center;gap:6px;order:3;margin-top:8px;opacity:1!important}
#lafPanel .liftCatPanelActions button,.scaLabActions button{width:36px;height:36px;border:1px solid var(--c-line);border-radius:10px;background:#fff;cursor:pointer;font-size:14px}
#lafPanel .liftCatPanelActions button:last-child,.scaLabActions button:last-child{color:#b42318}
#lafPanel .liftCatPanelIcon,.scaLabLogo{position:static!important;width:46px!important;height:46px!important;border-radius:12px!important;display:grid!important;place-items:center;background:var(--c-ink);color:#fff;font-weight:700;font-size:18px;overflow:hidden;flex:none}
.scaLabLogo{background:#fff;border:1px solid var(--c-line);color:var(--c-ink)}
.scaLabLogo img{width:100%;height:100%;object-fit:contain}
#lafPanel .liftCatPanelName,.scaLabName{font-size:13px;font-weight:600;line-height:1.3;margin-top:4px}
#lafPanel .liftCatPanelMeta,.scaLabMeta{font-size:11.5px;color:var(--c-muted)}
#lafPanel .liftCatPanelCreate,.scaLabCreate{width:100%;min-height:46px;border:1.5px dashed #b9beb9;border-radius:14px;background:#fff;font:600 13px Poppins,Arial,sans-serif;cursor:pointer;margin:0 0 10px;display:block}
.scaLabTools{display:flex;gap:8px;margin-bottom:10px}
.scaLabTools input{flex:1}
.scaHint{font-size:12px;color:var(--c-muted);margin:0 2px 10px}
/* Variaciones: atajo */
.scaGoSelect{margin-top:10px}
/* Celular */
@media(max-width:700px){
 #lafPanel .lafTabs{padding:8px 10px}
 #lafPanel .lafTab{height:36px;padding:0 12px;font-size:12px}
 #lafPanel .lafBody{padding:10px!important}
 #laf-products .lafTools{flex-wrap:wrap}
 #laf-products .lafTools .lafInput{min-width:0;width:100%;flex:1 1 100%}
 #laf-products:not(.scaBulkOn) #lafProductList .lafBulkRow,#laf-products.scaBulkOn #lafProductList .lafBulkRow{grid-template-columns:auto 48px minmax(0,1fr)!important;grid-template-areas:"chk img name" "fields fields fields" "act act act"}
 #laf-products:not(.scaBulkOn) #lafProductList .lafBulkRow{grid-template-columns:48px minmax(0,1fr)!important;grid-template-areas:"img name" "fields fields" "act act"}
 #lafProductList .lafBulkCheckWrap{grid-area:chk!important}
 #lafProductList .lafRow>img{grid-area:img!important;width:48px;height:48px}
 #lafProductList .lafRow>div:not(.liftInlineFields):not(.lafActions){grid-area:name!important;min-width:0}
 #lafProductList .liftInlineFields{grid-area:fields!important;grid-template-columns:1fr!important}
 #lafProductList .liftInlineFields .liftUrlInput{display:none}
 #lafProductList .lafRow.scaShowPhotos .liftInlineFields .liftUrlInput{display:block}
 #lafProductList .lafActions{grid-area:act!important;display:flex;gap:6px}
 #lafProductList .lafActions .lafIcon{flex:1;width:auto}
 #lafProductList .lafActions .scaSave{flex:2;font-size:13px;font-weight:600}
 .scaPhotos{display:block}
 #lafPanel .lafOfferRow{grid-template-columns:1fr 1fr!important}
 #lafPanel .lafOfferRow>div:first-child{grid-column:1/-1}
 #lafPanel .lafOfferRow>div:last-child{grid-column:1/-1;display:flex;gap:6px}
 #lafPanel .lafOfferRow>div:last-child button{flex:1;min-height:42px}
 #lafPanel .lafOfferRow input{width:100%;min-width:0}
 #lafCategoryList,.scaLabList{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 #laf-products.scaBulkOn .lafBulkTools select,#laf-products.scaBulkOn .lafBulkTools button{flex:1 1 45%}
}
`;

var TAB_ICONS={products:['📦','Productos'],create:['➕','Crear'],offers:['🔥','Ofertas'],combos:['🎁','Combos'],categories:['🏷️','Categorías'],labs:['🏭','Laboratorios'],variants:['🎨','Variaciones'],excel:['📊','Excel']};
var $=function(id){return document.getElementById(id)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var norm=function(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim()};
function debounce(fn,ms){var t;return function(){var a=arguments,s=this;clearTimeout(t);t=setTimeout(function(){fn.apply(s,a)},ms)}}
function wrap(name,after){var orig=window[name];if(typeof orig!=='function'||orig.__sca)return;var w=function(){var r=orig.apply(this,arguments);try{after.apply(this,arguments)}catch(e){console.warn('Catálogo:',e)}if(r&&typeof r.then==='function')r.then(function(){try{after()}catch(e){}},function(){});return r};w.__sca=true;window[name]=w}

/* ---------- Pestañas ---------- */
function setupTabs(){
  var tabs=document.querySelector('#lafPanel .lafTabs');if(!tabs)return;
  if(!tabs.querySelector('[data-pane="labs"]')){
    var cat=tabs.querySelector('[data-pane="categories"]');
    var b=document.createElement('button');b.className='lafTab';b.dataset.pane='labs';b.setAttribute('onclick',"lafTab('labs',this)");b.textContent='Laboratorios';
    if(cat&&cat.nextSibling)tabs.insertBefore(b,cat.nextSibling);else tabs.appendChild(b);
  }
  [].forEach.call(tabs.querySelectorAll('.lafTab'),function(t){
    var info=TAB_ICONS[t.dataset.pane];if(!info||t.querySelector('.ti'))return;
    t.innerHTML='<span class="ti" aria-hidden="true">'+info[0]+'</span><span>'+info[1]+'</span>';
  });
  var body=document.querySelector('#lafPanel .lafBody');
  if(body&&!$('laf-labs')){
    var s=document.createElement('section');s.id='laf-labs';s.className='lafPane';
    s.innerHTML='<button type="button" class="scaLabCreate" id="scaLabNew">+ Crear laboratorio</button>'+
      '<div class="scaLabTools"><input id="scaLabSearch" class="lafInput" type="search" placeholder="Buscar laboratorio…" autocomplete="off"></div>'+
      '<p class="scaHint" id="scaLabCount"></p><div class="scaLabList" id="scaLabList"></div>';
    var cats=$('laf-categories');if(cats&&cats.nextSibling)body.insertBefore(s,cats.nextSibling);else body.appendChild(s);
    $('scaLabNew').onclick=function(){if(typeof window.liftLabAdminOpen==='function')window.liftLabAdminOpen('')};
    $('scaLabSearch').addEventListener('input',debounce(renderLabs,150));
    $('scaLabList').addEventListener('click',function(e){
      var btn=e.target.closest('button[data-act]');if(!btn)return;var n=btn.closest('[data-lab]').dataset.lab,act=btn.dataset.act;
      if(act==='edit'&&window.liftLabAdminOpen)window.liftLabAdminOpen(n);
      else if(act==='dup'&&window.liftLabAdminDuplicate)window.liftLabAdminDuplicate(n);
      else if(act==='del'&&window.liftLabAdminDelete)window.liftLabAdminDelete(n);
    });
  }
}
function onTab(name){
  var t=document.querySelector('#lafPanel .lafTab[data-pane="'+name+'"]');
  if(t&&t.scrollIntoView)try{t.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'})}catch(e){}
  var body=document.querySelector('#lafPanel .lafBody');if(body)body.scrollTop=0;
  if(name==='labs')renderLabs();
  if(name==='create')markSaveBar();
}

/* ---------- Laboratorios ---------- */
function labList(){
  var counts={},cfg=window.LIFT_LABORATORIES_SUPABASE||{};
  (window.PRODUCTS||[]).forEach(function(p){var b=String(p&&p.brand||'').trim();if(b)counts[b]=(counts[b]||0)+1});
  Object.keys(cfg).forEach(function(k){var c=cfg[k]||{};if(c.__deleted||c.active===false)return;if(!(k in counts))counts[k]=0});
  return Object.keys(counts).map(function(n){return {name:n,count:counts[n],order:Number((cfg[n]||{}).order)||9999}})
    .sort(function(a,b){return a.order-b.order||a.name.localeCompare(b.name,'es')});
}
function renderLabs(){
  var box=$('scaLabList');if(!box)return;
  var q=norm(($('scaLabSearch')||{}).value),all=labList(),labs=all.filter(function(l){return !q||norm(l.name).indexOf(q)>=0});
  $('scaLabCount').textContent=labs.length+' de '+all.length+' laboratorios';
  box.innerHTML=labs.map(function(l){
    var logo='';try{logo=window.liftLabLogo?window.liftLabLogo(l.name):''}catch(e){}
    return '<div class="scaLabCard" data-lab="'+esc(l.name)+'"><div class="scaLabLogo">'+(logo?'<img loading="lazy" src="'+esc(logo)+'" alt="" onerror="this.replaceWith(document.createTextNode(\''+esc(l.name.charAt(0).toUpperCase())+'\'))">':esc(l.name.charAt(0).toUpperCase()))+'</div>'+
      '<div class="scaLabName">'+esc(l.name)+'</div><div class="scaLabMeta">'+l.count+' producto'+(l.count===1?'':'s')+'</div>'+
      '<div class="scaLabActions"><button type="button" data-act="dup" title="Duplicar">⧉</button><button type="button" data-act="edit" title="Editar">✎</button><button type="button" data-act="del" title="Eliminar">⌫</button></div></div>';
  }).join('')||'<div class="lafNote">No encontré ese laboratorio.</div>';
}

/* ---------- Productos ---------- */
var FILTERS=[['','Todos'],['available','Disponibles'],['out','Agotados'],['offer','En oferta'],['noimg','📷 Sin imagen']];
function sinImagen(p){return !/^(https?:\/\/|\/|data:image\/)/i.test(String(p&&p.image||'').trim())}
function contarSinImagen(){var b=document.querySelector('.scaChips [data-f="noimg"]');if(!b||!window.PRODUCTS)return;var n=window.PRODUCTS.filter(sinImagen).length;b.textContent='📷 Sin imagen'+(n?' ('+n+')':'')}
/* Subir foto directo desde la fila: comprime, sube a Supabase y guarda la fila. */
var SBF='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-catalogo-imagen',SBK='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
function comprimir(file){return new Promise(function(ok,ko){var i=new Image();i.onload=function(){var k=Math.min(1,1600/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);var t=c.toDataURL('image/webp',.86);if(t.indexOf('data:image/webp')!==0)t=c.toDataURL('image/jpeg',.88);URL.revokeObjectURL(i.src);ok(t)};i.onerror=function(){ko(new Error('No se pudo leer la imagen'))};i.src=URL.createObjectURL(file)})}
async function subirFoto(row,id,file){
  var btn=row.querySelector('.scaUp'),main=document.getElementById('liftMainUrl_'+id);
  if(!file||!/^image\//.test(file.type)){alert('Elige una imagen (JPG, PNG o WebP)');return}
  var pw='';try{pw=sessionStorage.getItem('liftAdminCloudPasswordV1')||''}catch(e){}
  if(!pw){pw=prompt('Clave de administración para subir la foto')||'';if(!pw)return}
  if(btn){btn.disabled=true;btn.textContent='Subiendo…'}
  try{
    var data=await comprimir(file),type=data.slice(5,data.indexOf(';'));
    var r=await fetch(SBF,{method:'POST',headers:{apikey:SBK,'Content-Type':'application/json'},body:JSON.stringify({password:pw,data:data,type:type,producto_id:String(id)})});
    var j=await r.json().catch(function(){return{}});
    if(!r.ok||!j.url)throw new Error(j.error||('Error '+r.status));
    if(main){main.value=j.url;main.dispatchEvent(new Event('input',{bubbles:true}))}
    var img=row.querySelector(':scope > img');if(img){img.style.visibility='';img.src=j.url}
    var save=row.querySelector('.scaSave')||row.querySelector('button[title^="Guardar"]');if(save)save.click();
    if(btn){btn.textContent='✓ Foto subida';btn.classList.add('ok')}
    setTimeout(contarSinImagen,2500);
  }catch(e){alert('No se subió la foto: '+e.message);if(btn){btn.disabled=false;btn.textContent='⬆ Subir foto'}}
}
function setupProducts(){
  var pane=$('laf-products'),tools=pane&&pane.querySelector('.lafTools'),search=$('lafSearch'),sel=$('lafStatusFilter');
  if(!tools||tools.querySelector('.scaChips'))return;
  if(search){search.oninput=null;search.removeAttribute('oninput');search.placeholder='Buscar por nombre, marca o categoría…';search.addEventListener('input',debounce(function(){window.lafRenderProducts&&window.lafRenderProducts()},220))}
  var chips=document.createElement('div');chips.className='scaChips';
  chips.innerHTML=FILTERS.map(function(f){return '<button type="button" data-f="'+f[0]+'">'+f[1]+'</button>'}).join('')+'<button type="button" class="scaBulkToggle" id="scaBulkToggle">☑ Seleccionar varios</button>';
  tools.appendChild(chips);
  function paint(){var v=sel?sel.value:'';[].forEach.call(chips.querySelectorAll('[data-f]'),function(b){b.classList.toggle('on',b.dataset.f===v)})}
  chips.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.id==='scaBulkToggle'){setBulk(!pane.classList.contains('scaBulkOn'));return}
    if(sel){sel.value=b.dataset.f;sel.dispatchEvent(new Event('change'))}paint();
  });
  paint();
  var list=$('lafProductList');if(!list)return;
  list.addEventListener('input',function(e){var r=e.target.closest('.lafRow');if(r&&e.target.matches('input:not([type=checkbox])')){r.classList.add('scaDirty');r.classList.remove('scaSaved')}});
  list.addEventListener('keydown',function(e){
    if(e.key!=='Enter'||!e.target.matches('.liftInlineFields input'))return;
    e.preventDefault();var r=e.target.closest('.lafRow'),b=r&&r.querySelector('.scaSave');if(b)b.click();
  });
  list.addEventListener('click',function(e){
    var ph=e.target.closest('.scaPhotos');if(ph){var r=ph.closest('.lafRow');var on=r.classList.toggle('scaShowPhotos');ph.textContent=on?'Ocultar fotos':'📷 Fotos';return}
    var sv=e.target.closest('.scaSave');if(sv){var row=sv.closest('.lafRow');setTimeout(function(){if(/Guardado/.test(sv.title||'')){row.classList.remove('scaDirty');row.classList.add('scaSaved')}},1600)}
  },true);
}
function setBulk(on){
  var pane=$('laf-products'),t=$('scaBulkToggle');if(!pane)return;
  pane.classList.toggle('scaBulkOn',on);if(t){t.classList.toggle('on',on);t.textContent=on?'✓ Selección múltiple':'☑ Seleccionar varios'}
  if(!on&&typeof window.lafBulkClear==='function'){try{window.lafBulkClear()}catch(e){}}
}
function decorateProducts(){
  var list=$('lafProductList');if(!list)return;
  [].forEach.call(list.querySelectorAll('.lafRow'),function(r){
    var acts=r.querySelector('.lafActions');if(!acts||acts.querySelector('.scaPhotos'))return;
    var save=acts.querySelector('button[title^="Guardar"]');
    if(save){save.classList.add('scaSave');save.title='Guardar precio e imágenes (Enter)';if(window.matchMedia('(max-width:700px)').matches)save.textContent='Guardar'}
    var ph=document.createElement('button');ph.type='button';ph.className='lafIcon scaPhotos';ph.textContent='📷 Fotos';ph.title='Ver y editar las URL de las fotos';
    acts.insertBefore(ph,acts.firstChild);
    var cb=r.querySelector('.lafBulkCheck'),id=cb&&cb.value,p=id&&window.PRODUCTS&&window.PRODUCTS.find(function(x){return String(x.id)===String(id)});
    if(p&&sinImagen(p)&&!r.querySelector('.scaUp')){
      var up=document.createElement('button');up.type='button';up.className='scaUp';up.textContent='⬆ Subir foto';up.title='Subir una foto desde tu equipo o celular (también puedes arrastrarla a la fila)';
      var fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.hidden=true;
      up.onclick=function(){fi.click()};fi.onchange=function(){if(fi.files[0])subirFoto(r,id,fi.files[0]);fi.value=''};
      var info=r.querySelector('.lafName');(info?info.parentNode:acts).appendChild(up);acts.appendChild(fi);r.classList.add('scaNoImg');
      r.addEventListener('dragover',function(e){e.preventDefault();r.classList.add('scaDrop')});
      r.addEventListener('dragleave',function(){r.classList.remove('scaDrop')});
      r.addEventListener('drop',function(e){e.preventDefault();r.classList.remove('scaDrop');var f=e.dataTransfer&&e.dataTransfer.files[0];if(f)subirFoto(r,id,f)});
    }
  });
  contarSinImagen();
  var pane=$('laf-products'),sel=window.LIFT_BULK_SELECTED;
  if(pane&&sel&&sel.size&&!pane.classList.contains('scaBulkOn'))setBulk(true);
  var shown=list.querySelectorAll('.lafRow').length,count=$('lafCount'),old=list.querySelector('.scaMore');if(old)old.remove();
  var m=count&&/^(\d+)/.exec(count.textContent||'');
  if(m&&Number(m[1])>shown){var d=document.createElement('div');d.className='scaMore';d.textContent='Mostrando '+shown+' de '+m[1]+'. Escribe en el buscador para encontrar el resto.';list.appendChild(d)}
}

/* ---------- Ofertas ---------- */
function setupOffers(){
  var s=$('lafOfferSearch');if(!s||s.dataset.sca)return;s.dataset.sca='1';
  s.oninput=null;s.removeAttribute('oninput');s.placeholder='Buscar producto para poner o quitar oferta…';
  s.addEventListener('input',debounce(function(){window.lafRenderOffers&&window.lafRenderOffers()},220));
}

/* ---------- Categorías ---------- */
function decorateCategories(){
  [].forEach.call(document.querySelectorAll('#lafCategoryList .liftCatPanelCard'),function(c){
    var i=c.querySelector('.liftCatPanelIcon'),n=c.querySelector('.liftCatPanelName');
    if(i&&n&&i.textContent==='C')i.textContent=(n.textContent||'C').trim().charAt(0).toUpperCase();
  });
}

/* ---------- Crear producto ---------- */
function markSaveBar(){
  var b=document.querySelector('#laf-create button[onclick="lafSaveProduct()"]');
  if(b&&b.parentElement)b.parentElement.classList.add('scaSaveBar');
}

/* ---------- Variaciones ---------- */
function setupVariants(){
  var empty=$('lafVariantBuilderEmpty');if(!empty||$('scaGoSelect'))return;
  var b=document.createElement('button');b.type='button';b.id='scaGoSelect';b.className='lafBtn primary scaGoSelect';b.textContent='Seleccionar productos para agrupar';
  b.onclick=function(){var t=document.querySelector('.lafTab[data-pane="products"]');if(window.lafTab)window.lafTab('products',t);setBulk(true);var s=$('lafSearch');if(s)setTimeout(function(){s.focus()},100)};
  empty.parentNode.insertBefore(b,empty.nextSibling);
}

/* ---------- Arranque ---------- */
function install(){
  if(!$('lafPanel'))return false;
  if(!$('sca-style')){var st=document.createElement('style');st.id='sca-style';st.textContent=CSS;document.head.appendChild(st)}
  setupTabs();setupProducts();setupOffers();setupVariants();markSaveBar();
  wrap('lafTab',function(name){onTab(name)});
  wrap('lafRenderProducts',decorateProducts);
  wrap('lafRenderCategories',decorateCategories);
  ['liftLabAdminSave','liftLabAdminDelete','liftLabAdminDuplicate'].forEach(function(n){wrap(n,function(){setTimeout(renderLabs,300)})});
  decorateProducts();decorateCategories();
  return true;
}
function boot(){if(install())return;var tries=0,t=setInterval(function(){if(install()||++tries>40)clearInterval(t)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
// Algunos módulos del admin reemplazan funciones después de cargar: volver a envolverlas.
window.addEventListener('load',function(){setTimeout(install,500);setTimeout(install,2500)});
})();

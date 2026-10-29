/* SUPGO | Cálculo de ofertas mayoristas */
(()=>{'use strict';
if(window.SupgoCalculoOfertas)return;
const money=n=>Number(n||0).toLocaleString('es-CO');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let catalog=[];
function normalize(p){const j=p.product||p;return {id:p.id||j.id,nombre:j.name||j.nombre||p.nombre||'',marca:j.brand||j.marca||p.marca||'',precio:Number(j.price??j.precio??p.precio??0),activo:p.activo!==false};}
async function load(){
 const url='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_productos';
 const key='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const all=[];
 for(let offset=0;offset<100000;offset+=500){
  const response=await fetch(url+'?select=id,product,activo&order=id.asc&limit=500&offset='+offset,{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store'});
  if(!response.ok)throw new Error('Supabase HTTP '+response.status);
  const page=await response.json();
  all.push(...page);
  if(page.length<500)break;
 }
 return all.map(normalize).filter(x=>x.nombre&&x.activo);
}
const css=`
#supgoOffersOverlay .co-add-row{margin:12px 0 20px;background:#f7f7f7;border:1px dashed #c9c9c9;width:100%;padding:13px}
#supgoOffersOverlay .co-price-source{display:block;color:#555;font-size:11px;margin-top:5px}
#supgoOffersOverlay{position:fixed;inset:0;z-index:2147483000;background:#fff;display:none;flex-direction:column;font:400 13px Poppins,Arial,sans-serif;color:#151515}
#supgoOffersOverlay.is-open{display:flex}
#supgoOffersOverlay *{box-sizing:border-box}
#supgoOffersOverlay header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px clamp(14px,3vw,36px);border-bottom:1px solid #e6e6e6;flex-wrap:wrap}
#supgoOffersOverlay h2{font-size:18px;font-weight:600;margin:0}
#supgoOffersOverlay .co-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#supgoOffersOverlay input,#supgoOffersOverlay textarea,#supgoOffersOverlay select{font:inherit;background:#fff;border:1px solid #dedede;border-radius:9px;padding:9px;min-width:0}
#supgoOffersOverlay input[type=number]{width:118px}
#supgoOffersOverlay input[type=date]{width:162px}
#supgoOffersOverlay button{cursor:pointer;border:1px solid #dcdcdc;background:#fff;border-radius:9px;padding:10px 13px;font:500 12px Poppins,Arial,sans-serif}
#supgoOffersOverlay .co-primary{background:#111;color:#fff;border-color:#111}
#supgoOffersOverlay .co-scroll{overflow:auto;flex:1;padding:18px clamp(12px,3vw,36px)}
#supgoOffersOverlay table{border-collapse:separate;border-spacing:0;width:100%;min-width:1120px}
#supgoOffersOverlay th{background:#f7f7f7;text-align:left;font-weight:600;font-size:11px;padding:11px;border-bottom:1px solid #e5e5e5;position:sticky;top:0;z-index:2}
#supgoOffersOverlay td{padding:8px;border-bottom:1px solid #eee;vertical-align:top}
#supgoOffersOverlay td input{width:100%}
#supgoOffersOverlay td .co-final{font-weight:600;background:#f7f7f7}
#supgoOffersOverlay .co-search-results{position:absolute;top:100%;left:0;right:0;z-index:20;max-height:240px;overflow:auto;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 8px 20px #0002;display:none}
#supgoOffersOverlay .co-search-results button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eee;border-radius:0;padding:9px}
#supgoOffersOverlay .co-search-results button:hover{background:#f2f2f2}
#supgoOffersOverlay .co-search{position:relative}
#supgoOffersOverlay .co-notes{width:100%;resize:vertical;min-height:32px}
#supgoOffersOverlay .co-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px clamp(14px,3vw,36px);border-top:1px solid #e6e6e6;flex-wrap:wrap}
@media(max-width:700px){#supgoOffersOverlay h2{font-size:15px}#supgoOffersOverlay .co-scroll{padding:10px}#supgoOffersOverlay header{padding:12px}#supgoOffersOverlay .co-footer{padding:10px}}
`;
function open(){
let overlay=document.getElementById('supgoOffersOverlay');
if(overlay){overlay.classList.add('is-open');return;}
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
overlay=document.createElement('div');overlay.id='supgoOffersOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Cálculo ofertas');
overlay.innerHTML=`<header><h2>Cálculo ofertas</h2><div class="co-controls"><label>Válida hasta <input id="co-date" type="date"></label><button id="co-reset">Limpiar</button><button id="co-copy" class="co-primary">Copiar prompt Supabase</button><button id="co-close" aria-label="Cerrar">✕ Cerrar</button></div></header><div class="co-scroll"><table><thead><tr><th style="width:30%">1. Producto · buscar (precio automático)</th><th style="width:12%">Promo mayorista</th><th style="width:10%">Incremento</th><th style="width:12%">Precio final</th><th style="width:24%">Regalo · buscar</th><th style="width:15%">Notas / sabores</th></tr></thead><tbody id="co-rows"></tbody></table><button type="button" id="co-add-row" class="co-add-row">+ Agregar 10 espacios</button></div><div class="co-footer"><span id="co-status">20 espacios iniciales · Selecciona productos y regalos desde el catálogo.</span><button id="co-copy-bottom" class="co-primary">Copiar prompt Supabase</button></div>`;
document.body.appendChild(overlay);
const body=overlay.querySelector('#co-rows');
function searchBox(cell,kind,row){
const wrap=document.createElement('div');wrap.className='co-search';const input=document.createElement('input');input.placeholder=kind==='product'?'Buscar producto…':'Buscar regalo…';input.setAttribute('aria-label',kind==='product'?'Buscar producto':'Buscar regalo');
const results=document.createElement('div');results.className='co-search-results';wrap.append(input,results);cell.append(wrap);
const selectItem=p=>{row.dataset[kind+'Id']=p.id;row.dataset[kind+'Name']=p.nombre;input.value=p.nombre;results.style.display='none';if(kind==='product'){row.dataset.normalPrice=String(p.precio||0);wrap.querySelector('.co-price-source')?.remove();const label=document.createElement('span');label.className='co-price-source';label.textContent='Precio en SUPGO: $ '+money(p.precio);wrap.append(label);}};
input.addEventListener('input',()=>{row.dataset[kind+'Id']='';row.dataset[kind+'Name']='';results.replaceChildren();const term=norm(input.value.trim());if(term.length<2){results.style.display='none';return;}const matches=catalog.filter(p=>norm(p.nombre+' '+p.marca).includes(term)).slice(0,12);matches.forEach(p=>{const btn=document.createElement('button');btn.type='button';btn.textContent=p.nombre+' · '+p.marca+' · $'+money(p.precio);btn.onclick=()=>selectItem(p);results.append(btn)});results.style.display=matches.length?'block':'none';});
input.addEventListener('blur',()=>setTimeout(()=>results.style.display='none',170));
}
function addRow(){
const tr=document.createElement('tr');tr.innerHTML=`<td></td><td><input class="co-wholesale" type="number" min="0" placeholder="0"></td><td><input class="co-margin" type="number" min="0" placeholder="0"></td><td><input class="co-final" type="text" readonly placeholder="$ 0"></td><td></td><td><textarea class="co-notes" rows="1" placeholder="Sabores y notas"></textarea></td>`;searchBox(tr.children[0],'product',tr);searchBox(tr.children[4],'gift',tr);
const calc=()=>{const w=Number(tr.querySelector('.co-wholesale').value)||0;const m=Number(tr.querySelector('.co-margin').value)||0;tr.querySelector('.co-final').value=(tr.querySelector('.co-wholesale').value||tr.querySelector('.co-margin').value)?'$ '+money(w+m):'';};
tr.querySelector('.co-wholesale').addEventListener('input',calc);tr.querySelector('.co-margin').addEventListener('input',calc);body.append(tr);
}
for(let i=0;i<20;i++)addRow();
overlay.querySelector('#co-add-row').onclick=()=>{for(let i=0;i<10;i++)addRow();status.textContent='Agregados 10 espacios. Total: '+body.querySelectorAll('tr').length;};
const status=overlay.querySelector('#co-status');
const copy=async()=>{
const lines=[];body.querySelectorAll('tr').forEach((tr,i)=>{const id=tr.dataset.productId,name=tr.dataset.productName;if(!id)return;const normal=Number(tr.dataset.normalPrice||0),wholesale=Number(tr.querySelector('.co-wholesale').value||0),margin=Number(tr.querySelector('.co-margin').value||0),price=wholesale+margin,giftId=tr.dataset.giftId||'',gift=tr.dataset.giftName||'',note=tr.querySelector('.co-notes').value.trim();if(!price)return;lines.push([i+1,id,name,normal,price,giftId,gift,note]);});
if(!lines.length){status.textContent='Selecciona un producto y un precio válido antes de copiar.';return}
const date=overlay.querySelector('#co-date').value;
const prompt=`Actúa como administrador de ofertas de SUPGO en Supabase. La tabla exacta de promociones es public.lift_catalog_config: busca el registro cuya columna clave es weekly_offers y actualiza únicamente las entradas de los IDs indicados dentro del objeto JSON de la columna valor. No crees otra tabla ni sustituyas el JSON completo: conserva las demás promociones y campos existentes. Actualiza ÚNICAMENTE los productos identificados por sus IDs exactos en la siguiente lista. Para cada producto configura el precio de oferta FINAL, el producto de regalo por su ID cuando corresponda, el nombre del regalo y las notas/sabores. Fecha de finalización: ${date||'sin especificar'}. Usa la estructura real y existente de las tablas, inspecciona el esquema antes de escribir, conserva el precio normal, no inventes productos ni IDs, no dupliques promociones y verifica los registros después de actualizarlos. El JSON de cada oferta puede contener price, originalPrice, promoUntil, gift, giftProductId, giftName y note. Usa los campos realmente existentes, registra originalPrice desde el precio normal y gift=true solo cuando haya regalo. No inventes productos ni campos; si existe un impedimento, informa sin hacer cambios destructivos. La promo mayorista y el incremento son cálculos internos, NO los guardes como precio final separado.\n\n`+lines.map(([i,id,name,normal,price,giftId,gift,note])=>`${i}. Producto: ${name} | ID producto: ${id} | Precio normal: ${normal} COP | Precio oferta: ${price} COP | Regalo: ${gift||'ninguno'} | ID regalo: ${giftId||'ninguno'} | Notas/sabores: ${note||'sin notas'}`).join('\n');
try{await navigator.clipboard.writeText(prompt)}catch(e){const t=document.createElement('textarea');t.value=prompt;document.body.append(t);t.select();document.execCommand('copy');t.remove();}
status.textContent='Prompt copiado: '+lines.length+' oferta(s), con IDs y precio final.';
};
overlay.querySelector('#co-copy').onclick=copy;overlay.querySelector('#co-copy-bottom').onclick=copy;
overlay.querySelector('#co-close').onclick=()=>overlay.classList.remove('is-open');
overlay.querySelector('#co-reset').onclick=()=>{if(!confirm('¿Limpiar todas las filas?'))return;overlay.remove();open();};
overlay.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.classList.remove('is-open')});
const now=new Date();const localDate=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);overlay.querySelector('#co-date').value=localDate;
load().then(items=>{catalog=items;status.textContent=items.length?'Buscador listo: '+items.length+' productos con precio de SUPGO.':'No se encontraron productos.';}).catch(e=>{status.textContent='Error cargando productos: '+e.message;console.error('Calculadora ofertas:',e);});
}
window.SupgoCalculoOfertas={open};

/* SUPGO private operations shell: existing tools remain responsible for their own logic. */

function installAdminToolTheme(){
 if(document.getElementById('supgoAdminToolTheme'))return;
 const style=document.createElement('style');style.id='supgoAdminToolTheme';
 style.textContent=`
 /* Private administrative interfaces only. Customer pages remain untouched. */
 body.liftAdminUnlocked #supgoOffersOverlay,
 body.liftAdminUnlocked #lift-instagram-seo-modal,
 body.liftAdminUnlocked #liftCrmPanel,
 body.liftAdminUnlocked #liftCalcPanel,
 body.liftAdminUnlocked #liftPaymentsAdminPanel{color:#edf5ff!important;background:#090e16!important;font-family:system-ui,Arial,sans-serif!important}
 body.liftAdminUnlocked #supgoOffersOverlay header,
 body.liftAdminUnlocked #supgoOffersOverlay .co-footer{background:#111925!important;border-color:#29374a!important;color:#f2f7ff!important}
 body.liftAdminUnlocked #supgoOffersOverlay h2{color:#a5ff53!important;font-weight:800!important}
 body.liftAdminUnlocked #supgoOffersOverlay .co-scroll{background:#090e16!important}
 body.liftAdminUnlocked #supgoOffersOverlay table{border-spacing:0 5px!important}
 body.liftAdminUnlocked #supgoOffersOverlay th{background:#141e2b!important;color:#a5ff53!important;border-color:#29374a!important}
 body.liftAdminUnlocked #supgoOffersOverlay td{background:#111a26!important;border-color:#29374a!important;padding:10px!important}
 body.liftAdminUnlocked #supgoOffersOverlay input,
 body.liftAdminUnlocked #supgoOffersOverlay textarea,
 body.liftAdminUnlocked #supgoOffersOverlay select{background:#182333!important;color:#edf5ff!important;border:1px solid #33445a!important;outline-color:#a5ff53!important}
 body.liftAdminUnlocked #supgoOffersOverlay input::placeholder,
 body.liftAdminUnlocked #supgoOffersOverlay textarea::placeholder{color:#8c9cb3!important}
 body.liftAdminUnlocked #supgoOffersOverlay button{background:#1a2838!important;color:#e9f2ff!important;border-color:#35465a!important}
 body.liftAdminUnlocked #supgoOffersOverlay button:hover{border-color:#a5ff53!important}
 body.liftAdminUnlocked #supgoOffersOverlay .co-primary{background:#a5ff53!important;color:#101711!important;border-color:#a5ff53!important;font-weight:800!important}
 body.liftAdminUnlocked #supgoOffersOverlay .co-final{background:#1c3025!important;color:#a5ff53!important;font-weight:800!important}
 body.liftAdminUnlocked #supgoOffersOverlay .co-price-source{color:#a5ff53!important}
 body.liftAdminUnlocked #supgoOffersOverlay .co-search-results{background:#131d2b!important;border-color:#344459!important;box-shadow:0 16px 35px #0008!important}
 body.liftAdminUnlocked #supgoOffersOverlay .co-search-results button{background:#131d2b!important;color:#f2f7ff!important}
 body.liftAdminUnlocked #supgoOffersOverlay .co-search-results button:hover{background:#243728!important;color:#a5ff53!important}
 body.liftAdminUnlocked #supgoOffersOverlay .co-add-row{background:#14231a!important;border:1px dashed #a5ff53!important;color:#a5ff53!important}
 body.liftAdminUnlocked #lift-instagram-seo-modal{background:#080c12ee!important}
 body.liftAdminUnlocked #lift-instagram-seo-modal section[role="dialog"]{background:#111a26!important;color:#edf5ff!important;border:1px solid #33445a!important;border-radius:18px!important;box-shadow:0 20px 60px #0009!important}
 body.liftAdminUnlocked #lift-instagram-seo-modal h2,
 body.liftAdminUnlocked #lift-instagram-seo-modal h3{color:#a5ff53!important}
 body.liftAdminUnlocked #lift-instagram-seo-modal input,
 body.liftAdminUnlocked #lift-instagram-seo-modal textarea,
 body.liftAdminUnlocked #lift-instagram-seo-modal select{background:#1a2737!important;color:#edf5ff!important;border:1px solid #3a4c62!important;border-radius:9px!important}
 body.liftAdminUnlocked #lift-instagram-seo-modal button{border-radius:9px!important;border:1px solid #3d5067!important;background:#233347!important;color:#edf5ff!important}
 body.liftAdminUnlocked #lift-instagram-seo-modal button:hover{border-color:#a5ff53!important;color:#a5ff53!important}
 body.liftAdminUnlocked #liftCalcPanel{border:1px solid #35475b!important;border-radius:14px!important;box-shadow:0 18px 50px #0008!important}
 @media(max-width:700px){body.liftAdminUnlocked #supgoOffersOverlay table{min-width:1050px!important}body.liftAdminUnlocked #supgoOffersOverlay td{padding:7px!important}}
 `;
 document.head.append(style);
}
function mountAdminHub(){
 if(!document.body.classList.contains('liftAdminUnlocked')||document.getElementById('supgoAdminHub'))return;
 const style=document.createElement('style');style.id='supgoAdminHubStyles';
 style.textContent=`
 #supgoAdminHub{position:fixed;inset:0;z-index:2147482000;display:none;background:#080c12;color:#f3f7fc;font:400 14px system-ui,Arial,sans-serif}
 #supgoAdminHub.open{display:flex}
 #supgoAdminHub *{box-sizing:border-box}
 #supgoAdminHub .hub-sidebar{width:235px;flex-shrink:0;background:#0e141d;border-right:1px solid #263143;padding:24px 13px;display:flex;flex-direction:column;gap:8px}
 #supgoAdminHub .hub-logo{font-size:21px;font-weight:850;letter-spacing:-.8px;margin:4px 9px 27px}
 #supgoAdminHub .hub-nav{background:transparent;border:0;color:#a5b7d3;text-align:left;padding:13px 15px;border-radius:11px;cursor:pointer;font:600 13px system-ui}
 #supgoAdminHub .hub-nav:hover,#supgoAdminHub .hub-nav.active{background:#203127;color:#a5ff53}
 #supgoAdminHub .hub-main{flex:1;overflow:auto;padding:35px clamp(16px,4vw,54px)}
 #supgoAdminHub .hub-eyebrow{font-size:11px;letter-spacing:2px;font-weight:800;color:#a5ff53}
 #supgoAdminHub h1{font-size:clamp(27px,3vw,39px);margin:12px 0 8px;letter-spacing:-1.3px}
 #supgoAdminHub .hub-muted{color:#8da3c2}
 #supgoAdminHub .hub-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:15px;margin-top:27px}
 #supgoAdminHub .hub-card{background:#121a26;border:1px solid #2a3648;border-radius:15px;padding:21px;min-height:158px}
 #supgoAdminHub .hub-card h3{margin:0 0 10px;font-size:17px}
 #supgoAdminHub .hub-card p{font-size:13px;line-height:1.5;color:#9bb0ca}
 #supgoAdminHub .hub-card button,#supgoAdminHub .hub-close{background:#a5ff53;color:#111;border:0;border-radius:9px;padding:11px 15px;font-weight:750;cursor:pointer}
 #supgoAdminHub .hub-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
 #supgoAdminHub .hub-close{background:#1e2938;color:white;border:1px solid #334155}
 #supgoAdminHub .hub-status{margin-top:22px;color:#a5ff53;font-size:12px}
 #supgoAdminHub .hub-menu-toggle{display:none}
 #supgoAdminLaunch{position:fixed;left:15px;bottom:18px;z-index:2147481999;border:1px solid #a5ff53;border-radius:12px;background:#111b18;color:#a5ff53;padding:12px 16px;font:700 13px system-ui;cursor:pointer;box-shadow:0 6px 25px #0005}
 @media(max-width:720px){#supgoAdminHub .hub-sidebar{width:70px;padding:18px 7px}#supgoAdminHub .hub-logo{font-size:10px;margin:10px 2px 22px;letter-spacing:0}#supgoAdminHub .hub-nav{font-size:10px;padding:12px 5px;text-align:center}#supgoAdminHub .hub-main{padding:24px 15px}#supgoAdminHub .hub-grid{grid-template-columns:1fr}}
 `;
 document.head.append(style);
 const root=document.createElement('div');root.id='supgoAdminHub';root.setAttribute('role','dialog');root.setAttribute('aria-label','Panel administrativo SUPGO');
 const tools=[
 ['Ofertas','Calcula precios mayoristas, regalos y promociones.','offers'],
 ['CRM','Consulta y administra tus clientes.','liftCrmFloatingBtn'],
 ['Pagos','Abre las herramientas internas de pagos.','liftPaymentsAdminBtn'],
 ['Calculadora','Utiliza tu calculadora administrativa.','liftCalcToggle'],
 ['Instagram SEO','Prepara contenido y publicaciones.','lift-ig-seo-launcher'],
 ['Herramientas','Accede a las funciones adicionales del catálogo.','liftAdminToolsMain']
 ];
 root.innerHTML='<aside class="hub-sidebar"><div class="hub-logo">SUPGO<span style="color:#a5ff53">.CONTROL</span></div><button class="hub-nav active" data-hub-home>⌂ Inicio</button>'+tools.map((t,i)=>'<button class="hub-nav" data-hub-tool="'+i+'">'+t[0]+'</button>').join('')+'<div style="margin-top:auto;color:#74849a;font-size:11px;padding:10px">Solo administración</div></aside><main class="hub-main"><div class="hub-top"><span class="hub-eyebrow">TU CENTRO DE OPERACIONES</span><button class="hub-close" id="hubClose">✕ Cerrar</button></div><h1>Dashboard comercial</h1><p class="hub-muted">Tus herramientas internas en un solo lugar, sin alterar el catálogo público.</p><div class="hub-grid">'+tools.map((t,i)=>'<section class="hub-card"><h3>'+t[0]+'</h3><p>'+t[1]+'</p><button data-hub-tool="'+i+'">Abrir herramienta ↗</button></section>').join('')+'</div><p class="hub-status" id="hubStatus">Selecciona una herramienta para trabajar.</p></main>';
 document.body.append(root);
 const launcher=document.createElement('button');launcher.id='supgoAdminLaunch';launcher.textContent='▦ SUPGO Control';document.body.append(launcher);
 const close=()=>{root.classList.remove('open');document.body.style.overflow=''};
 const open=()=>{root.classList.add('open');document.body.style.overflow='hidden'};
 launcher.onclick=open;root.querySelector('#hubClose').onclick=close;
 root.querySelectorAll('[data-hub-home]').forEach(b=>b.onclick=()=>{root.querySelector('#hubStatus').textContent='Selecciona una herramienta para trabajar.'});
 root.querySelectorAll('[data-hub-tool]').forEach(b=>b.onclick=()=>{
  const item=tools[Number(b.dataset.hubTool)];
  if(item[2]==='offers'){close();window.SupgoCalculoOfertas.open();return}
  const target=document.getElementById(item[2]);
  if(!target){root.querySelector('#hubStatus').textContent='La herramienta '+item[0]+' no está disponible en esta vista.';return}
  close();target.click();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('open'))close()});
}
function initializeHub(){
 installAdminToolTheme();
 if(document.body.classList.contains('liftAdminUnlocked'))mountAdminHub();
 const observer=new MutationObserver(()=>{if(document.body.classList.contains('liftAdminUnlocked'))mountAdminHub();else{document.getElementById('supgoAdminHub')?.remove();document.getElementById('supgoAdminLaunch')?.remove();}});
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeHub);else initializeHub();

})();
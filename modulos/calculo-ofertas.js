/* SUPGO | Cálculo de ofertas mayoristas */
(()=>{'use strict';
if(window.SupgoCalculoOfertas)return;
const money=n=>Number(n||0).toLocaleString('es-CO');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let catalog=[];
function normalize(p){const j=p.product||p;return {id:p.id||j.id,nombre:p.nombre||j.nombre||j.name||'',marca:p.marca||j.marca||'',precio:Number(p.precio??j.precio??j.price??p.price??0),activo:p.activo!==false};}
async function load(){
const raw=window.PRODUCTS;if(Array.isArray(raw)&&raw.length)return raw.map(normalize).filter(x=>x.nombre);
for(const sb of [window.supabaseClient,window.supabase,window.sb,window.liftSupabase,window._supabase]){
if(sb&&typeof sb.from==='function'){try{const {data,error}=await sb.from('lift_productos').select('id,nombre,marca,precio,activo').eq('activo',true).limit(2500);if(!error&&data?.length)return data.map(normalize)}catch(e){console.warn('Ofertas: catálogo',e)}}}
return [];
}
const css=`
#supgoOffersOverlay .co-add-row{margin:12px 0 20px;background:#f7f7f7;border:1px dashed #c9c9c9;width:100%;padding:13px}
#supgoOffersOverlay .co-price-source{display:block;color:#555;font-size:10px;margin-top:4px}
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
overlay.innerHTML=`<header><h2>Cálculo ofertas</h2><div class="co-controls"><label>Válida hasta <input id="co-date" type="date"></label><button id="co-reset">Limpiar</button><button id="co-copy" class="co-primary">Copiar prompt Supabase</button><button id="co-close" aria-label="Cerrar">✕ Cerrar</button></div></header><div class="co-scroll"><table><thead><tr><th style="width:24%">1. Producto · buscar</th><th style="width:11%">Precio normal</th><th style="width:12%">Promo mayorista</th><th style="width:10%">Incremento</th><th style="width:12%">Precio final</th><th style="width:24%">Regalo · buscar</th><th style="width:15%">Notas / sabores</th></tr></thead><tbody id="co-rows"></tbody></table><button type="button" id="co-add-row" class="co-add-row">+ Agregar 10 espacios</button></div><div class="co-footer"><span id="co-status">20 espacios iniciales · Selecciona productos y regalos desde el catálogo.</span><button id="co-copy-bottom" class="co-primary">Copiar prompt Supabase</button></div>`;
document.body.appendChild(overlay);
const body=overlay.querySelector('#co-rows');
function searchBox(cell,kind,row){
const wrap=document.createElement('div');wrap.className='co-search';const input=document.createElement('input');input.placeholder=kind==='product'?'Buscar producto…':'Buscar regalo…';input.setAttribute('aria-label',kind==='product'?'Buscar producto':'Buscar regalo');
const results=document.createElement('div');results.className='co-search-results';wrap.append(input,results);cell.append(wrap);
const selectItem=p=>{row.dataset[kind+'Id']=p.id;row.dataset[kind+'Name']=p.nombre;input.value=p.nombre;results.style.display='none';if(kind==='product'){row.querySelector('.co-normal').value=p.precio||'';row.querySelector('.co-normal').title='Precio normal del catálogo SUPGO (Supabase)';}};
input.addEventListener('input',()=>{row.dataset[kind+'Id']='';row.dataset[kind+'Name']='';results.replaceChildren();const term=norm(input.value.trim());if(term.length<2){results.style.display='none';return;}const matches=catalog.filter(p=>norm(p.nombre+' '+p.marca).includes(term)).slice(0,12);matches.forEach(p=>{const btn=document.createElement('button');btn.type='button';btn.textContent=p.nombre+' · '+p.marca+' · $'+money(p.precio);btn.onclick=()=>selectItem(p);results.append(btn)});results.style.display=matches.length?'block':'none';});
input.addEventListener('blur',()=>setTimeout(()=>results.style.display='none',170));
}
function addRow(){
const tr=document.createElement('tr');tr.innerHTML=`<td></td><td><input class="co-normal" type="number" min="0" placeholder="0"></td><td><input class="co-wholesale" type="number" min="0" placeholder="0"></td><td><input class="co-margin" type="number" min="0" placeholder="0"></td><td><input class="co-final" type="text" readonly placeholder="$ 0"></td><td></td><td><textarea class="co-notes" rows="1" placeholder="Sabores y notas"></textarea></td>`;searchBox(tr.children[0],'product',tr);searchBox(tr.children[5],'gift',tr);
const calc=()=>{const w=Number(tr.querySelector('.co-wholesale').value)||0;const m=Number(tr.querySelector('.co-margin').value)||0;tr.querySelector('.co-final').value=(tr.querySelector('.co-wholesale').value||tr.querySelector('.co-margin').value)?'$ '+money(w+m):'';};
tr.querySelector('.co-wholesale').addEventListener('input',calc);tr.querySelector('.co-margin').addEventListener('input',calc);body.append(tr);
}
for(let i=0;i<20;i++)addRow();
overlay.querySelector('#co-add-row').onclick=()=>{for(let i=0;i<10;i++)addRow();status.textContent='Agregados 10 espacios. Total: '+body.querySelectorAll('tr').length;};
const status=overlay.querySelector('#co-status');
const copy=async()=>{
const lines=[];body.querySelectorAll('tr').forEach((tr,i)=>{const id=tr.dataset.productId,name=tr.dataset.productName;if(!id)return;const normal=Number(tr.querySelector('.co-normal').value||0),wholesale=Number(tr.querySelector('.co-wholesale').value||0),margin=Number(tr.querySelector('.co-margin').value||0),price=wholesale+margin,giftId=tr.dataset.giftId||'',gift=tr.dataset.giftName||'',note=tr.querySelector('.co-notes').value.trim();if(!price)return;lines.push([i+1,id,name,normal,price,giftId,gift,note]);});
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
load().then(items=>{catalog=items;status.textContent=items.length?'Catálogo cargado: '+items.length+' productos.':'No se pudo leer el catálogo. Comprueba el inicio de sesión.';});
}
window.SupgoCalculoOfertas={open};
})();
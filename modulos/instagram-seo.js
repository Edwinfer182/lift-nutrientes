/* SUPGO Instagram SEO | modulo reconstruido desde cero */
(function(){
'use strict';
const $=(selector,root=document)=>root.querySelector(selector);
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const value=(p,...keys)=>{for(const k of keys){const v=p?.[k]??p?.product?.[k];if(v!==undefined&&v!==null&&v!=='')return v;}return '';};
const product=p=>({ ...p,id:value(p,'id'),nombre:String(value(p,'nombre','name','title')),marca:String(value(p,'marca','brand')),imagen:String(value(p,'imagen','image','imagen_url')),sabor:String(value(p,'sabor','flavor')),precio:value(p,'precio','price'),categoria:String(value(p,'categoria','category')) });
const formatPrice=n=>Number(n)>0?'$'+Number(n).toLocaleString('es-CO'):'';
const button=(label,fn,primary=false)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='border:1px solid '+(primary?'#151515':'#ddd')+';border-radius:9px;padding:10px 14px;background:'+(primary?'#151515':'#fff')+';color:'+(primary?'#fff':'#222')+';cursor:pointer;font:500 12px Poppins,Arial,sans-serif';b.onclick=fn;return b};
function catalog(){
 const raw=window.PRODUCTS;
 if(Array.isArray(raw))return raw.map(product).filter(x=>x.nombre);
 if(raw&&typeof raw==='object')return Object.values(raw).map(product).filter(x=>x.nombre);
 return [];
}
async function loadCatalog(){
 let items=catalog();if(items.length)return items;
 for(const client of [window.supabaseClient,window.supabase,window.sb,window.liftSupabase,window._supabase]){
  if(!client||typeof client.from!=='function')continue;
  try{const {data,error}=await client.from('lift_productos').select('*').limit(1000);if(!error&&Array.isArray(data)&&data.length)return data.map(product).filter(x=>x.nombre)}catch(e){console.warn('Instagram SEO catalogo',e)}
 }
 return [];
}
function generate(raw,objective='ventas',style=0){
 const p=product(raw),full=[p.nombre,p.marca].filter(Boolean).join(' · ');
 if(!p.nombre)throw Error('Selecciona un producto del catalogo');
 const title=[p.nombre,p.marca,formatPrice(p.precio)].filter(Boolean).join(' - ');
 const openings={
 ventas:['¿Buscas '+full+' en Medellín?','Conoce '+full+' en SUPGO.','¿Ya conocías '+full+'?'],
 educativo:['Antes de elegir '+full+', revisa sus características.','Conoce la presentación de '+full+'.','Descubre los detalles de '+full+'.'],
 alcance:['¿Conoces '+full+'?','Si buscas '+full+' en Colombia, mira esto.','Hoy te mostramos '+full+'.']
 };
 const i=Math.max(0,Number(style)||0)%3;
 const intro=(openings[objective]||openings.ventas)[i];
 const body='Consulta su presentación, características y disponibilidad en SUPGO. Atención en Medellín y envíos a Colombia.';
 const url=String(value(raw,'url_producto','product_url','url','enlace')||'https://supgo.co');
 const safeUrl=/^https:\/\/(?:[a-z0-9-]+\.)?supgo\.co(?:\/|$)/i.test(url)?url:'https://supgo.co';
 const tags=[p.nombre,p.marca,'SuplementosMedellin','SuplementosColombia','SUPGO'].filter(Boolean).map(t=>'#'+norm(t).replace(/[^a-z0-9]/g,'')).filter((x,i,a)=>x.length>1&&a.indexOf(x)===i).join(' ');
 const description=[intro,body,'📲 Consulta precio y disponibilidad.','🔗 '+safeUrl,tags].join('\n\n');
 const alt='Fotografía de '+full+(p.sabor?', sabor '+p.sabor:'')+(formatPrice(p.precio)?', precio '+formatPrice(p.precio):'')+'. Suplemento disponible para consultar en SUPGO.';
 return {titulo:title,descripcion:description,alt};
}
function modal(title){
 const existing=document.getElementById('lift-instagram-seo-modal');if(existing)existing.remove();
 const root=document.createElement('div');root.id='lift-instagram-seo-modal';
 root.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#0009;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box';
 const panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.style.cssText='width:min(680px,100%);max-height:92vh;overflow:auto;background:white;border-radius:18px;padding:22px;box-sizing:border-box;color:#161616;font:400 13px Poppins,Arial,sans-serif;box-shadow:0 20px 65px #0003';
 const header=document.createElement('header');header.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px';
 const h=document.createElement('h2');h.textContent=title;h.style.cssText='margin:0;font-size:19px;font-weight:600';
 header.append(h,button('Cerrar ✕',()=>root.remove()));panel.append(header);root.append(panel);document.body.append(root);
 root.onclick=e=>{if(e.target===root)root.remove()};
 return {root,panel};
}
function field(container,labelText,text,rows){
 const wrap=document.createElement('div');wrap.style.cssText='border:1px solid #e9e9e9;border-radius:12px;padding:12px;margin-top:12px';
 const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px';
 const label=document.createElement('strong');label.textContent=labelText;label.style.fontWeight='500';
 const area=document.createElement('textarea');area.value=text;area.rows=rows;area.setAttribute('aria-label',labelText);
 area.style.cssText='display:block;width:100%;box-sizing:border-box;border:1px solid #eee;border-radius:8px;background:#fafafa;padding:11px;font:400 13px/1.6 Poppins,Arial,sans-serif;resize:vertical';
 const copy=button('Copiar',async()=>{try{await navigator.clipboard.writeText(area.value)}catch{area.select();document.execCommand('copy')}copy.textContent='Copiado ✓'},true);
 top.append(label,copy);wrap.append(top,area);container.append(wrap);
}
function open(raw){
 const p=product(raw),ui=modal('Publicación Instagram');
 const controls=document.createElement('div');controls.style.cssText='display:flex;gap:10px;flex-wrap:wrap';
 const select=(name,options)=>{const l=document.createElement('label');l.textContent=name;l.style.cssText='flex:1;min-width:130px';const s=document.createElement('select');s.style.cssText='display:block;width:100%;padding:10px;margin-top:6px;border:1px solid #ddd;border-radius:9px;background:white;font:inherit';options.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o)});l.append(s);controls.append(l);return s};
 const objective=select('Objetivo',[['ventas','Ventas'],['educativo','Educativo'],['alcance','Alcance']]);
 const style=select('Estilo',[['0','Directo'],['1','Asesoría'],['2','Descubrimiento']]);
 const fields=document.createElement('div');ui.panel.append(controls,fields);
 const render=()=>{fields.replaceChildren();const d=generate(raw,objective.value,style.value);field(fields,'Nombre + marca + precio',d.titulo,2);field(fields,'Descripción + hashtags',d.descripcion,8);field(fields,'Texto alternativo',d.alt,3)};
 const prompts=document.createElement('div');prompts.style.cssText='margin-top:16px;border-top:1px solid #eee;padding-top:14px';
 const heading=document.createElement('strong');heading.textContent='Prompts para @Estados';heading.style.cssText='display:block;font-size:14px;margin-bottom:9px';
 const explanation=document.createElement('p');explanation.textContent='Copia el prompt y úsalo con @Estados junto con la imagen original del producto.';explanation.style.cssText='font-size:12px;color:#666;margin:0 0 10px';
 prompts.append(heading,explanation);
 const promptText=(mode)=>{
  const p=product(raw);
  const name=[p.nombre,p.marca].filter(Boolean).join(' · ');
  const dimensions=mode==='publicacion'?'publicación de Instagram, formato vertical 4:5 (1080 × 1350 px)':'estado de WhatsApp / historia de Instagram, formato vertical 9:16 (1080 × 1920 px)';
  return '@Estados: Crea una imagen de '+dimensions+' para '+name+'. Utiliza la programación y el estilo visual que ya tenemos definidos para @Estados. Conserva fielmente el envase, etiqueta, marca, colores y sabor de la fotografía original que adjunto. Diseño profesional, limpio, con poco texto, producto protagonista, sin logos inventados ni afirmaciones no verificadas. Producto: '+p.nombre+'. Marca: '+(p.marca||'no especificada')+'. Sabor: '+(p.sabor||'no especificado')+'. Precio: '+(formatPrice(p.precio)||'no mostrar precio')+'. No agregues información nutricional que no sea visible o esté confirmada. Entrega una sola imagen lista para publicar.';
 };
 for(const [mode,label] of [['publicacion','Copiar prompt · Publicación 4:5'],['estado','Copiar prompt · Estado 9:16']]){
  const btn=button(label,async()=>{const text=promptText(mode);try{await navigator.clipboard.writeText(text);btn.textContent='Copiado ✓'}catch{const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();document.execCommand('copy');area.remove();btn.textContent='Copiado ✓'}},mode==='publicacion');
  btn.style.margin='4px 7px 4px 0';prompts.append(btn);
 }
 ui.panel.append(prompts);
 objective.onchange=render;style.onchange=render;render();
}
async function openSelector(){
 const ui=modal('Instagram SEO · Productos');
 const search=document.createElement('input');search.placeholder='Buscar por nombre o marca';search.setAttribute('aria-label','Buscar producto');search.style.cssText='width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;padding:12px;font:inherit';
 const preview=document.createElement('div');preview.style.cssText='margin:14px 0';
 const editor=document.createElement('div');editor.style.cssText='margin-top:14px;border-top:1px solid #e8e8e8;padding-top:14px';
 const results=document.createElement('div');results.style.cssText='max-height:210px;overflow:auto';
 ui.panel.append(search,results,preview,editor);
 const items=await loadCatalog();if(!ui.root.isConnected)return;
 function selectProduct(p){
  preview.replaceChildren();editor.replaceChildren();
  const card=document.createElement('div');card.style.cssText='background:#fafafa;border:1px solid #eee;border-radius:12px;padding:12px';
  const row=document.createElement('div');row.style.cssText='display:flex;gap:14px;align-items:center';
  const photo=document.createElement('img');photo.alt=p.nombre;photo.style.cssText='width:95px;height:115px;object-fit:contain;background:white;border-radius:8px';
  if(p.imagen){photo.src=p.imagen;row.append(photo)}
  const info=document.createElement('div');info.style.cssText='flex:1;min-width:0';
  const name=document.createElement('strong');name.textContent=p.nombre;
  const meta=document.createElement('div');meta.textContent=[p.marca,formatPrice(p.precio)].filter(Boolean).join(' · ');meta.style.cssText='color:#666;margin-top:5px';
  info.append(name,meta);row.append(info);card.append(row);
  const variants=items.filter(x=>x.id!==p.id&&norm(x.nombre)===norm(p.nombre)&&x.id);
  let selected=p;
  function renderEditor(){
   editor.replaceChildren();
   const heading=document.createElement('h3');heading.textContent='Contenido listo para copiar';heading.style.cssText='font-size:15px;font-weight:600;margin:0 0 10px';editor.append(heading);
   const controls=document.createElement('div');controls.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
   const makeSelect=(label,opts)=>{const wrap=document.createElement('label');wrap.textContent=label;wrap.style.cssText='flex:1;min-width:120px;font-size:12px';const select=document.createElement('select');select.style.cssText='display:block;width:100%;padding:9px;border:1px solid #ddd;border-radius:8px;background:#fff';opts.forEach(([v,t])=>{const op=document.createElement('option');op.value=v;op.textContent=t;select.append(op)});wrap.append(select);controls.append(wrap);return select};
   const objective=makeSelect('Objetivo',[["ventas","Ventas"],["educativo","Educativo"],["alcance","Alcance"]]);
   const style=makeSelect('Estilo',[["0","Directo"],["1","Asesoría"],["2","Descubrimiento"]]);
   const fields=document.createElement('div');editor.append(controls,fields);
   const draw=()=>{fields.replaceChildren();const d=generate(selected,objective.value,style.value);field(fields,'Nombre + marca + precio',d.titulo,2);field(fields,'Descripción + hashtags',d.descripcion,6);field(fields,'Texto alternativo',d.alt,2)};
   objective.onchange=draw;style.onchange=draw;draw();
   const prompts=document.createElement('div');prompts.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:12px';
   for(const [mode,label,dimensions] of [["publicacion","Copiar prompt · Publicación 4:5","1080 × 1350 px"],["estado","Copiar prompt · Estado 9:16","1080 × 1920 px"]]){
    const b=button(label,async()=>{const text="@Estados: Haz esta imagen con la programación visual que tenemos para "+(mode==='publicacion'?'publicaciones de Instagram':'estados e historias')+", tamaño "+dimensions+". Producto: "+selected.nombre+". Marca: "+selected.marca+". Sabor: "+(selected.sabor||'no especificado')+". Precio: "+(formatPrice(selected.precio)||'no mostrar')+". Conserva fielmente la fotografía y la etiqueta original. Diseño limpio, producto protagonista, sin saturar de texto ni inventar información.";try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove()}b.textContent='Copiado ✓'},mode==='publicacion');prompts.append(b)
   }
   editor.append(prompts);
  }
  renderEditor();
  if(variants.length){const s=document.createElement('select');s.style.cssText='width:100%;margin-top:12px;padding:10px;border:1px solid #ddd;border-radius:8px';[p,...variants].forEach((v,i)=>{const o=document.createElement('option');o.value=i;o.textContent=v.sabor||v.nombre+' · '+(i+1);s.append(o)});s.onchange=()=>{selected=[p,...variants][Number(s.value)];if(selected.imagen)photo.src=selected.imagen;meta.textContent=[selected.marca,formatPrice(selected.precio)].filter(Boolean).join(' · ');renderEditor()};card.append(s)}
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';
  actions.append(button('Compartir imagen',async()=>{if(!selected.id||typeof window.shareLiftProductImage!=='function'){alert('No está disponible el generador de imágenes para este producto');return}try{await window.shareLiftProductImage(selected.id)}catch(e){alert('No se pudo compartir: '+e.message)}},true),button('Ver SEO ↓',()=>editor.scrollIntoView({behavior:'smooth',block:'nearest'})));
  card.append(actions);preview.append(card);
 }
 function render(){results.replaceChildren();const term=norm(search.value);const found=items.filter(p=>norm(p.nombre+' '+p.marca).includes(term)).slice(0,10);if(!found.length){const msg=document.createElement('p');msg.textContent=items.length?'No hay coincidencias':'No se pudo cargar el catálogo';results.append(msg);return}found.forEach(p=>{const b=button([p.nombre,p.marca].filter(Boolean).join(' · '),()=>selectProduct(p));b.style.cssText+=';display:block;width:100%;text-align:left;margin:5px 0;background:#fafafa';results.append(b)})}
 search.oninput=render;render();search.focus();
}
window.LiftInstagramSEO={generate,open,openSelector};
})();

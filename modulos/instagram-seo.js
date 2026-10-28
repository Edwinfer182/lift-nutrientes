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

function renderTikTokGenerator(panel){
 const topics=['NAC','Creatina monohidratada','Creatina HCL','Creapure','Proteína whey','Proteína aislada','Proteína hidrolizada','Proteína vegetal','Caseína','Mass gainer','Preentrenos','Café y preentreno','Preentreno sin cafeína','Cafeína','Citrulina','Beta alanina','BCAA','EAA','Glutamina','Electrolitos','Omega 3','Magnesio glicinato','Magnesio citrato','ZMA','Multivitamínicos','Vitamina D','Zinc','Colágeno','Glucosamina y condroitina','Probióticos','Enzimas digestivas','Ashwagandha','Coenzima Q10','Curcumina','Inositol','Suplementos para principiantes','Cómo leer etiquetas','Suplementos originales','Cuándo tomar suplementos','Suplementos y descanso'];
 const hooks=[
 ['¿Vale la pena X?','¿Vale la pena {x}?'],['Antes de comprar X','Antes de comprar {x}, escucha esto.'],['No hagas X sin revisar','No compres {x} sin revisar lo que contiene.'],['3 errores con X','3 errores que debes evitar con {x}.'],['¿Necesitas X?','¿Realmente necesitas {x}?'],['Lo que nadie explica','Lo que casi nadie te explica sobre {x}.'],['El error más común','Este es un error frecuente con {x}.'],['¿Qué dice la evidencia?','¿Qué dice realmente la evidencia sobre {x}?'],['No compres X todavía','No compres {x} todavía sin revisar la etiqueta.'],['El mito de X','Hay un mito sobre {x} que necesitas entender.'],['¿Qué revisar primero?','¿Qué deberías revisar primero en {x}?'],['El precio no lo es todo','¿Pagar más por {x} significa comprar mejor?'],['Te están confundiendo','¿Te están confundiendo con {x}?'],['Deja de hacer esto','Deja de elegir {x} sin revisar la etiqueta.'],['¿Sabes qué compras?','¿Tú sí sabes qué estás comprando cuando eliges {x}?'],['Antes de gastar','Antes de gastar en {x}, revisa esto.'],['No te dejes llevar','No te dejes llevar por la publicidad de {x}.'],['¿Lo estás usando bien?','¿Estás evaluando correctamente {x}?'],['El detalle olvidado','Este detalle de {x} merece tu atención.'],['Si empiezas de cero','Si vas a empezar con {x}, ten esto presente.'],['No confundas las cosas','No confundas {x} con una solución para todo.'],['La pregunta incómoda','¿Para qué necesitas realmente {x}?'],['Mira la etiqueta','¿Ya revisaste la etiqueta de {x}?'],['Lo que haría diferente','Si comprara {x}, revisaría esto primero.'],['¿Es indispensable?','¿Es indispensable {x} para tus objetivos?'],['Cuidado con el marketing','¿Estás eligiendo {x} por evidencia o por publicidad?'],['No te compliques','No te compliques con {x} sin entender lo básico.'],['Una cosa es comprar','Una cosa es comprar {x} y otra saber para qué sirve.'],['Te falta revisar esto','Si estás pensando en {x}, te falta revisar esto.'],['Hablemos claro','Hablemos claro sobre {x}.']
 ];
 const style='width:100%;box-sizing:border-box;padding:10px;border:1px solid #ddd;border-radius:9px;background:#fff;font:inherit';
 const heading=document.createElement('h3');heading.textContent='Generador de guiones · TikTok';heading.style.cssText='font-size:15px;margin:4px 0 7px;font-weight:600';
 const hint=document.createElement('p');hint.textContent='Guiones de tú a tú: confrontativos, charros, educativos y con doble llamado a la acción.';hint.style.cssText='font-size:12px;color:#666;line-height:1.6;margin:0 0 14px';
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px';
 function select(label,options){const wrap=document.createElement('label');wrap.textContent=label;wrap.style.cssText='display:block;font-size:12px;font-weight:500';const el=document.createElement('select');el.style.cssText=style+';display:block;margin-top:6px';options.forEach(([value,title])=>{const o=document.createElement('option');o.value=value;o.textContent=title;el.append(o)});wrap.append(el);grid.append(wrap);return el}
 const topic=select('Tema',topics.map((t,i)=>[String(i),t]));
 const hook=select('Gancho',hooks.map((h,i)=>[String(i),(i+1)+'. '+h[0]]));
 const duration=select('Duración',[['30','30 segundos'],['45','45 segundos'],['60','60 segundos']]);duration.value='60';
 const tone=select('Personalidad',[['charro','Confrontativo y charro'],['fuerte','Más confrontativo'],['natural','Directo y natural']]);
 const engagement=select('Interacción',[['comentarios','Pedir comentarios'],['guardar','Invitar a guardar'],['seguir','Invitar a seguir']]);
 const commercial=select('Cierre comercial',[['interno','Escríbeme al interno'],['whatsapp','Escríbeme por WhatsApp'],['perfil','Enlace en mi perfil'],['asesoria','Asesoría por mensaje']]);
 const hookBox=document.createElement('div');hookBox.style.cssText='background:#f7f7f7;border-radius:10px;padding:12px;margin:14px 0;font-weight:500;font-size:13px';
 const salesLabel=document.createElement('label');salesLabel.textContent='Frase comercial editable';salesLabel.style.cssText='display:block;font-size:12px;font-weight:500;margin-top:12px';
 const sales=document.createElement('textarea');sales.rows=2;sales.style.cssText=style+';display:block;margin-top:6px;resize:vertical';sales.value='Y si deseas adquirir suplementos, háblame al interno y te asesoro.';
 const extraLabel=document.createElement('label');extraLabel.textContent='Indicaciones adicionales';extraLabel.style.cssText=salesLabel.style.cssText;
 const extra=document.createElement('textarea');extra.rows=2;extra.placeholder='Ej.: menciona un error común o compara ingredientes…';extra.style.cssText=sales.style.cssText;
 const promptLabel=document.createElement('strong');promptLabel.textContent='Prompt listo para copiar';promptLabel.style.cssText='display:block;font-size:13px;margin:15px 0 7px';
 const prompt=document.createElement('textarea');prompt.rows=13;prompt.style.cssText=style+';resize:vertical;font-size:12px;line-height:1.55;background:#fafafa';
 const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:10px';
 const copy=button('Copiar prompt',async()=>{try{await navigator.clipboard.writeText(prompt.value)}catch{prompt.select();document.execCommand('copy')}copy.textContent='Copiado ✓'},true);
 const send=button('Abrir ChatGPT',()=>{window.open('https://chatgpt.com/','_blank','noopener,noreferrer')});
 const vary=button('Otro gancho',()=>{hook.selectedIndex=(hook.selectedIndex+1)%hooks.length;update()});
 const example=document.createElement('p');example.style.cssText='font-size:11px;color:#666;line-height:1.6;margin:12px 0';
 example.textContent='Ritmo: una idea por bloque, máximo dos renglones, 3 a 5 segundos. El prompt se copia completo; en ChatGPT solo tienes que pegarlo.';
 function update(){
  const subject=topics[Number(topic.value)],selected=hooks[Number(hook.value)][1].replace(/\{x\}/g,subject.toLowerCase().replace(/^/,''));
  hookBox.textContent='Gancho obligatorio: '+selected;
  if(commercial.value==='interno'){sales.disabled=false}
  else {sales.disabled=true}
  const phrase=commercial.value==='interno'?sales.value:commercial.value==='whatsapp'?'Si deseas adquirir suplementos, escríbeme por WhatsApp y te asesoro.':commercial.value==='perfil'?'Si deseas consultar suplementos, revisa el enlace de mi perfil.':'Si necesitas orientación para adquirir suplementos, escríbeme por mensaje privado.';
  const n=duration.value==='60'?'12 a 16':duration.value==='45'?'9 a 12':'6 a 8';
  prompt.value=[
   'Actúa como guionista de TikTok especializado en suplementos deportivos, fitness y educación nutricional.',
   'TEMA: '+subject,
   'GANCHO SELECCIONADO (OBLIGATORIO): "'+selected+'"',
   'Comienza el guion con ese gancho EXACTAMENTE como está escrito, sin reformularlo ni añadir palabras antes.',
   'PALABRAS CLAVE SEO: '+subject+', suplemento, suplementos deportivos, para qué sirve '+subject+'.',
   'CONTEXTO SEO OBLIGATORIO: el video siempre trata sobre SUPLEMENTOS. Menciona de forma audible la palabra exacta «suplemento» al menos una vez dentro de la explicación del GUION HABLADO, no solo en el título, el copy, hashtags o CTA. Si el tema es genérico como etiquetas, explica desde la primera parte que hablas de etiquetas de suplementos; usa expresiones naturales como «etiqueta de un suplemento» o «cuando compras un suplemento». No fuerces repeticiones ni cambies el gancho literal. También incluye «suplemento» naturalmente en el COPY PARA TIKTOK.',
   'DURACIÓN: aproximadamente '+duration.value+' segundos.',
   'PERSONALIDAD: '+(tone.value==='charro'?'confrontativa y charra con humor colombiano':tone.value==='fuerte'?'muy confrontativa, provocadora y charra':'directa, natural y ligeramente sarcástica')+'.',
   'VOZ: habla siempre de TÚ A TÚ a UNA sola persona como si la tuvieras enfrente. Usa tú, te, tu, haces, compras, revisaste. No uses expresiones colectivas como mucha gente, las personas, todos, hay quienes o la mayoría. No narres desde afuera lo que otros hacen.',
   'HUMOR: confronta las decisiones con expresiones charrras y naturales como NPC del gym, desalentado, parcero, prime o aura, únicamente cuando encajen. Sé gracioso y confrontativo sin insultar ni humillar. No inventes que el espectador hizo algo; usa preguntas directas cuando corresponda. Evita explicar extensamente el comportamiento: señala el error con una frase charra y pasa al argumento concreto.',
   'PROHIBIDOS: remates vacíos como por arte de magia, no es magia, no hace milagros, fórmula mágica, y listo, así de fácil, eso es todo. Ninguna idea debe acabar en relleno, motivación vacía ni frases robóticas. Termina con un dato, una consecuencia, una pregunta concreta o una recomendación.',
   'ESTRUCTURA EN CUATRO PARTES: 1) gancho literal y crítica graciosa al error; 2) problema y argumentación clara, con evidencia prudente; 3) solución útil y concreta; 4) doble llamado a la acción.',
   'DOBLE CTA: primero '+(engagement.value==='comentarios'?'haz una pregunta concreta que invite a comentar':engagement.value==='guardar'?'invita a guardar el video':'invita a seguir la cuenta')+'. Después añade naturalmente la invitación comercial: "'+phrase+'". Reserva tiempo para ambos dentro de la duración total, sin sonar como vendedor agresivo.',
   'RITMO DE GRABACIÓN: UNA SOLA IDEA POR BLOQUE. Cada bloque puede ocupar UNO O DOS RENGLONES como máximo; si son dos, deben desarrollar la misma idea continua. Cada bloque se debe poder pronunciar en aproximadamente 3 a 5 segundos. Separa cada bloque con una línea en blanco. Usa aproximadamente '+n+' bloques, sin marcas de tiempo ni instrucciones de edición. No dividas artificialmente las frases ni alargues una idea durante cinco líneas.',
   'Usa 2 o 3 frases SEO de manera natural. No inventes estudios, beneficios, resultados garantizados ni afirmaciones médicas. El CTA comercial no debe prometer efectos.',
   extra.value.trim()?'INDICACIÓN ADICIONAL: '+extra.value.trim():'',
   'IMÁGENES DE APOYO PARA CAPCUT: después del guion y del copy, escribe EXACTAMENTE CUATRO PROMPTS INDEPENDIENTES para generar imágenes relacionadas directamente con el tema '+subject+'. Deben corresponder a cuatro momentos diferentes del guion: 1) gancho o presentación del suplemento, 2) error o problema, 3) explicación visual concreta, 4) solución o recomendación. Cada prompt debe ser completo y autónomo para copiarlo por separado en otra IA generadora de imágenes. Solicita PNG con FONDO TRANSPARENTE REAL (canal alfa), objeto aislado, sin escenario ni fondo blanco, sin texto superpuesto, sin marcas ni logos inventados, sin datos nutricionales falsos. Estilo fotorrealista, iluminación profesional, composición clara y objetos completos, adecuados para superponer en videos verticales de CapCut. Los cuatro deben ser visualmente diferentes y mostrar objetos o conceptos pertinentes al tema, no cuatro tarros repetidos. Si el tema es etiquetas, muestra específicamente etiquetas de SUPLEMENTOS. No incluyas personas a menos que sea esencial. No generes imágenes: entrega solo los prompts de texto.',
   'ENTREGA SOLO ESTAS SECCIONES Y EN ESTE ORDEN: GUION PARA TIKTOK (cuatro partes narrativas en bloques breves, sin subtítulos intermedios); COPY PARA TIKTOK (SEO, pregunta, invitación discreta al interno y 3 a 5 hashtags); PALABRAS CLAVE (tres frases); CUATRO PROMPTS DE IMÁGENES DE APOYO (Imagen 1, Imagen 2, Imagen 3, Imagen 4, cada uno separado y listo para copiar en otra IA).',
   'Verifica antes de entregar: gancho idéntico, segunda persona singular, humor confrontativo y charro, máximo dos renglones por bloque, sin remates vacíos y dos CTA.'
  ].filter(Boolean).join('\n\n');
 }
 for(const el of [topic,hook,duration,tone,engagement,commercial,sales,extra]){el.addEventListener('input',update);el.addEventListener('change',update)}
 actions.append(copy,send,vary);panel.append(heading,hint,grid,hookBox,salesLabel,sales,extraLabel,extra,promptLabel,prompt,actions,example);update();
}

function renderLaboratorySEO(panel,items){
 const heading=document.createElement('h3');heading.textContent='SEO de productos por laboratorio';heading.style.cssText='font-size:16px;font-weight:600;margin:4px 0 7px';
 const hint=document.createElement('p');hint.textContent='Selecciona una marca para optimizar las fichas SEO de todos sus productos. Copia la orden para otra IA.';hint.style.cssText='font-size:12px;color:#666;line-height:1.6;margin:0 0 16px';
 const label=document.createElement('label');label.textContent='Laboratorio';label.style.cssText='display:block;font-size:12px;font-weight:600;margin-bottom:7px';
 const select=document.createElement('select');select.style.cssText='width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;background:#fff;font:inherit';
 const brands=[...new Set(items.map(p=>String(p.marca||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
 const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=brands.length?'Selecciona un laboratorio':'No se encontraron laboratorios en el catálogo';select.append(placeholder);
 brands.forEach(brand=>{const option=document.createElement('option');option.value=brand;option.textContent=brand;select.append(option)});
 const promptLabel=document.createElement('p');promptLabel.textContent='Prompt listo para copiar';promptLabel.style.cssText='font-size:12px;font-weight:600;margin:18px 0 8px';
 const preview=document.createElement('textarea');preview.readOnly=true;preview.rows=12;preview.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #ddd;border-radius:10px;background:#fafafa;font:12px/1.55 Poppins,Arial,sans-serif;resize:vertical';
 const copy=button('Copiar prompt SEO',async()=>{if(!select.value)return;try{await navigator.clipboard.writeText(preview.value)}catch(e){preview.focus();preview.select();document.execCommand('copy')}copy.textContent='Copiado ✓';setTimeout(()=>copy.textContent='Copiar prompt SEO',1800)},true);
 copy.style.marginTop='12px';
 function update(){
  const brand=select.value;copy.disabled=!brand;copy.style.opacity=brand?'1':'.55';
  preview.value=brand?`Actúa como especialista en SEO técnico, posicionamiento local y automatización GitHub para SUPGO.

MARCA SELECCIONADA: ${brand}
SITIO: https://supgo.co
REPOSITORIO: Edwinfer182/lift-nutrientes (rama main)

OBJETIVO OBLIGATORIO: OPTIMIZAR LAS FICHAS INDIVIDUALES DE TODOS LOS PRODUCTOS DE LA MARCA ${brand}. La marca es solamente el filtro para encontrar sus productos. NO optimices únicamente la página general del laboratorio ni entregues solamente su enlace. No des por terminada la tarea hasta revisar todos los productos de esa marca.

1. Consulta el catálogo real (Supabase o fuente vigente) y enumera TODOS los productos activos de ${brand}, con sus identificadores y URLs individuales. Comprueba también variantes o fichas separadas y evita duplicados. No inventes productos ni URLs.
2. Para CADA producto, optimiza individualmente su descripción larga y visible, título SEO, metadescripción, H1 y subtítulos, canonical, Open Graph y datos estructurados Product/Offer cuando corresponda. Redacta texto original, útil, específico de cada presentación, sin repetir una plantilla genérica ni afirmar beneficios no verificados.
3. Enfoca cada ficha en búsquedas comerciales de Medellín e incorpora naturalmente Bogotá, Cali, Barranquilla, Cartagena, Bucaramanga y Pereira cuando sea pertinente. Evita repetir ciudades o palabras clave artificialmente.
4. Añade exactamente 4 enlaces internos REALES y relevantes EN LA DESCRIPCIÓN DE CADA PRODUCTO, verificando sus destinos. Conserva el diseño y las funciones existentes.
5. Descubre automáticamente los workflows de .github/workflows/ y sus scripts. Verifica primero generar-paginas-seo.yml, que genera fichas individuales desde Supabase, y confirma su funcionamiento y la fuente correcta de las descripciones. No me preguntes qué workflow o archivo usar: investígalo.
6. Actualiza las descripciones de TODOS los productos de ${brand} en la fuente persistente correcta; evita cambios solo en HTML generado que luego se sobrescriban. Ejecuta el workflow apropiado, espera a que termine y comprueba que no existan errores.
7. Verifica en supgo.co, ficha por ficha, que la NUEVA descripción y metadatos se hayan publicado. Compara la lista de productos encontrados contra la lista de fichas verificadas. Si alguna falta o falla, identifícala y continúa con las demás sin declarar éxito total.
8. ENTREGA OBLIGATORIA Y FORMATO DE RESULTADOS: Después de publicar y verificar, entrega el inventario COMPLETO de fichas individuales de productos de ${brand}. Para CADA producto muestra: nombre exacto, ID, URL canónica pública completa y estado de actualización/verificación. Coloca junto a CADA URL un botón funcional «Copiar enlace» que copie exactamente esa URL; no basta con mostrar enlaces en texto. Añade además un botón «Copiar todos los enlaces» que copie TODAS las URLs verificadas, una por línea, listas para pegar en Google Search Console. Incluye otro botón «Abrir Google Search Console» que abra https://search.google.com/search-console para inspeccionar e indexar las URLs. Si la interfaz no permite botones funcionales, entrega cada URL en un bloque independiente fácilmente copiable y explica la limitación; nunca omitas las URLs.
9. No entregues solo el enlace de la página del laboratorio, el sitemap, el repositorio ni el workflow. La URL general de marca es opcional y secundaria. No resumas la lista con «y otros productos», no muestres solo ejemplos y no sustituyas los enlaces individuales por una cifra. Si hay muchos productos, divídelos en grupos hasta mostrar TODOS.
10. Incluye un resumen final con el número total de productos encontrados, activos, actualizados, publicados, verificados y fallidos. La lista de URLs verificadas debe coincidir con el recuento. Para las fichas fallidas, informa su ID, nombre, URL si existe y el motivo concreto.
11. La tarea es de EJECUCIÓN, no solo diagnóstico: investiga, modifica la fuente persistente, ejecuta el workflow, verifica el sitio y entrega los enlaces. No termines después de identificar tablas o workflows. Si una herramienta no está disponible, prueba los mecanismos autorizados disponibles; informa el bloqueo específico sin inventar una ejecución.
12. No inventes precios, disponibilidad, registros sanitarios, afirmaciones médicas, resultados de indexación ni verificaciones. Si falta algún permiso o proceso, explica exactamente el bloqueo.
9. No inventes precios, disponibilidad, registros sanitarios, afirmaciones médicas, resultados de indexación ni verificaciones. Si falta algún permiso o proceso, explica exactamente el bloqueo.

IMPORTANTE: Esta orden se refiere a TODOS LOS PRODUCTOS de la marca ${brand}, NO a optimizar la descripción general del laboratorio.`:'Selecciona un laboratorio para preparar la orden.';
 }
 select.onchange=update;panel.append(heading,hint,label,select,promptLabel,preview,copy);update();
}

async function openSelector(){
 const ui=modal('Contenido para Instagram');
 const nav=document.createElement('nav');nav.style.cssText='display:flex;gap:8px;border-bottom:1px solid #e8e8e8;padding-bottom:12px;margin-bottom:14px';
 const productTab=button('Productos · Imagen y SEO',()=>activate('productos'),true);
 const educationTab=button('Educación · Calendario',()=>activate('educacion'));
 const tiktokTab=button('TikTok · Guiones',()=>activate('tiktok'));
 const laboratoryTab=button('Laboratorios · SEO',()=>activate('laboratorios'));
 const productPanel=document.createElement('div');
 const educationPanel=document.createElement('div');educationPanel.hidden=true;
 educationPanel.style.cssText='display:none';
 const tiktokPanel=document.createElement('div');tiktokPanel.style.display='none';
 const laboratoryPanel=document.createElement('div');laboratoryPanel.style.display='none';
 nav.style.flexWrap='wrap';
 nav.append(productTab,educationTab,tiktokTab,laboratoryTab);ui.panel.append(nav,productPanel,educationPanel,tiktokPanel,laboratoryPanel);
 function activate(which){
  const showProducts=which==='productos';
  productPanel.style.display=showProducts?'block':'none';
  educationPanel.style.display=which==='educacion'?'block':'none';
  tiktokPanel.style.display=which==='tiktok'?'block':'none';
  laboratoryPanel.style.display=which==='laboratorios'?'block':'none';
  for(const [tab,key] of [[productTab,'productos'],[educationTab,'educacion'],[tiktokTab,'tiktok'],[laboratoryTab,'laboratorios']]){
   tab.style.background=which===key?'#151515':'#fff';tab.style.color=which===key?'#fff':'#222';
  }
  ui.panel.scrollTop=0;
 }
 renderTikTokGenerator(tiktokPanel);
 const search=document.createElement('input');search.placeholder='Buscar por nombre o marca';search.setAttribute('aria-label','Buscar producto');search.style.cssText='width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;padding:12px;font:inherit';
 const preview=document.createElement('div');preview.style.cssText='margin:14px 0';
 const editor=document.createElement('div');editor.style.cssText='margin-top:14px;border-top:1px solid #e8e8e8;padding-top:14px';
 const results=document.createElement('div');results.style.cssText='max-height:210px;overflow:auto';
 productPanel.append(search,results,preview,editor);
 const educationalProduct={nombre:'',marca:'',precio:'',sabor:''};
 function renderEducation(){educationPanel.replaceChildren();const selected=educationalProduct;
   const plan=document.createElement('section');plan.style.cssText='margin-top:16px;border:1px solid #e8e8e8;border-radius:12px;padding:14px';
   const title=document.createElement('h3');title.textContent='Planificador creativo · @Estados';title.style.cssText='font-size:15px;font-weight:600;margin:0 0 6px';
   const hint=document.createElement('p');hint.textContent='Combina el tipo de contenido con el tema. Cambia cualquiera de los dos y el prompt se actualiza sin repetir la misma idea.';hint.style.cssText='font-size:12px;color:#666;line-height:1.6;margin:0 0 12px';
   const layout=document.createElement('div');layout.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px';
   const types=[
    ['Educativo','Explica un concepto con lenguaje claro, una sola idea útil y datos verificables.'],
    ['Mitos y realidades','Contrasta un mito frecuente con una explicación rigurosa y sin exageraciones.'],
    ['Comparación','Compara dos opciones mediante criterios prácticos y sin declarar ganadores universales.'],
    ['Errores comunes','Presenta un error frecuente, por qué importa y una alternativa razonable.'],
    ['Preguntas frecuentes','Responde una pregunta concreta de forma sencilla y precisa.'],
    ['Consejo práctico','Ofrece un consejo aplicable con pasos breves y prudentes.'],
    ['Disciplina y motivación','Usa un mensaje breve de constancia y entrenamiento sin prometer resultados.'],
    ['Interacción','Plantea una pregunta o encuesta breve para generar respuestas.'],
    ['Producto protagonista','Presenta el producto seleccionado, sin inventar propiedades ni mostrar precio salvo que se solicite.'],
    ['Guía de compra','Explica criterios para elegir una opción según necesidades personales.'],
    ['Dato curioso','Presenta un dato sorprendente y verificable con contexto.'],['Verdadero o falso','Plantea una afirmación y aclara su validez.'],['Paso a paso','Explica un proceso simple en tres pasos.'],['Checklist','Ofrece una lista breve de verificación.'],['Antes y después de aprender','Contrasta una creencia inicial con una explicación fundamentada.'],['Glosario fitness','Define un término técnico en lenguaje cotidiano.'],['Caso hipotético','Ilustra una situación cotidiana sin inventar testimonios.'],['Reto semanal','Propón un reto de hábitos realista y seguro.'],['Encuesta','Invita a elegir entre dos opciones sin sesgar la respuesta.'],['Carrusel educativo','Organiza el contenido en varias láminas breves.'],['Mini guía','Resume los puntos clave para principiantes.'],['Lo que dice la evidencia','Distingue evidencia científica de publicidad sin inventar estudios.'],['Señales para revisar','Enumera criterios útiles sin diagnosticar.'],['Hábitos de entrenamiento','Propón hábitos sostenibles para entrenar.'],['Preguntas para tu entrenador','Sugiere preguntas prácticas para consultar a un profesional.']
   ];
   const themes=[
    'Creatina','Proteína whey','Proteína aislada vs concentrada','Preentrenos','EAA y BCAA','Hidratación','Recuperación y descanso','Lectura de etiquetas','Sabores y presentaciones','Entrenar solo','Constancia en el gimnasio','Nutrición deportiva','Errores de principiantes','Suplementos y alimentación','Preguntas de la comunidad','Creatina monohidratada','Creatina y horarios','Creatina y retención de agua','Proteína por porción','Whey vs alimentos','Proteína vegetal','Ganadores de masa','Cafeína y entrenamiento','Preentreno y sueño','Beta alanina','Citrulina','Electrolitos','Omega 3','Magnesio','Multivitamínicos','Colágeno','Enzimas digestivas','Probióticos','Carbohidratos y rendimiento','Déficit calórico','Superávit calórico','Progresión de cargas','Técnica de ejercicios','Calentamiento','Entrenamiento de fuerza','Hipertrofia','Entrenar en casa','Rutina de piernas','Rutina de espalda','Hombros','Bíceps y tríceps','Pantorrillas','Frecuencia de entrenamiento','Descanso entre series','Sueño y rendimiento','Motivación vs disciplina','Cómo empezar en el gimnasio','Cómo comparar precios por porción','Registro sanitario y etiquetas','Almacenamiento de suplementos','Suplementos para principiantes','Suplementos y expectativas realistas'
   ];
   const makeColumn=(heading,values)=>{const col=document.createElement('div');const label=document.createElement('strong');label.textContent=heading;label.style.cssText='display:block;font-size:13px;margin-bottom:8px';const sel=document.createElement('select');sel.style.cssText='width:100%;padding:10px;border:1px solid #ddd;border-radius:9px;background:white;font:inherit';values.forEach((v,i)=>{const o=document.createElement('option');o.value=i;o.textContent=Array.isArray(v)?v[0]:v;sel.append(o)});col.append(label,sel);layout.append(col);return sel};
   const typeSelect=makeColumn('Tipo de contenido',types);
   const themeSelect=makeColumn('Tema',themes);
   const extra=document.createElement('input');extra.placeholder='O escribe otro tema…';extra.setAttribute('aria-label','Tema personalizado');extra.style.cssText='width:100%;box-sizing:border-box;margin-top:9px;padding:10px;border:1px solid #ddd;border-radius:9px;font:inherit';
   themeSelect.parentNode.append(extra);
   const dayRow=document.createElement('div');dayRow.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin:12px 0';
   const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
   const day=document.createElement('select');day.style.cssText='flex:1;min-width:130px;padding:9px;border:1px solid #ddd;border-radius:9px;background:white';
   days.forEach((d,i)=>{const o=document.createElement('option');o.value=i;o.textContent=d;day.append(o)});
   day.value=String((new Date().getDay()+6)%7);
   const moment=document.createElement('select');moment.style.cssText=day.style.cssText;
   [['mañana','Mañana · 4:5'],['tarde','Tarde · 4:5'],['noche','Noche · 9:16']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;moment.append(o)});
   dayRow.append(day,moment);
   const promptLabel=document.createElement('strong');promptLabel.textContent='Prompt listo para copiar';promptLabel.style.cssText='display:block;font-size:13px;margin:12px 0 7px';
   const prompt=document.createElement('textarea');prompt.rows=7;prompt.setAttribute('aria-label','Prompt generado');prompt.style.cssText='width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:9px;background:#fafafa;font:400 12px/1.6 Poppins,Arial,sans-serif;resize:vertical';
   const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:9px';
   const copy=button('Copiar prompt',async()=>{try{await navigator.clipboard.writeText(prompt.value)}catch{prompt.select();document.execCommand('copy')}copy.textContent='Copiado ✓'},true);
   const random=button('Variar combinación',()=>{typeSelect.selectedIndex=(typeSelect.selectedIndex+3)%types.length;themeSelect.selectedIndex=(themeSelect.selectedIndex+5)%themes.length;extra.value='';update()});
   actions.append(copy,random);
   const copyTitle=document.createElement('strong');copyTitle.textContent='Copy para Instagram';copyTitle.style.cssText='display:block;margin:14px 0 7px;font-size:13px';
   const caption=document.createElement('textarea');caption.rows=6;caption.style.cssText=prompt.style.cssText;
   const captionButton=button('Copiar copy',()=>{navigator.clipboard.writeText(caption.value).then(()=>{captionButton.textContent='Copiado ✓'}).catch(()=>{caption.select();document.execCommand('copy')})},true);
   const captionArea=document.createElement('div');captionArea.append(copyTitle,caption,captionButton);
   function makeCaption(){
    const subject=extra.value.trim()||themes[Number(themeSelect.value)];
    const kind=types[Number(typeSelect.value)][0];
    const lower=subject.toLowerCase();
    let fact='',tip='',question='';
    if(/creatina/i.test(subject)){fact='La creatina ayuda a mejorar el rendimiento en esfuerzos cortos y de alta intensidad. La constancia importa más que una hora específica de consumo.';tip='No confundas cambios de agua dentro del músculo con un aumento inmediato de grasa.';question='¿La tomas a diario o solo cuando entrenas?'}
    else if(/proteína|whey|aislada|masa|ganador/i.test(subject)){fact='La proteína contribuye al mantenimiento y crecimiento de la masa muscular junto con entrenamiento y alimentación adecuados. Un batido es una opción práctica, no una obligación.';tip='Compara la proteína por porción, los ingredientes y tus necesidades antes de elegir.';question='¿Prefieres cubrir tus necesidades con alimentos, batidos o ambos?'}
    else if(/preentreno|cafeína|beta alanina|citrulina/i.test(subject)){fact='Los ingredientes de un preentreno no cumplen todos la misma función. La cafeína puede mejorar el estado de alerta, pero también afectar el sueño.';tip='Revisa ingredientes y cantidades; más estimulante no significa necesariamente mejor entrenamiento.';question='¿Revisas la cafeína antes de elegir un preentreno?'}
    else if(/eaa|bcaa|aminoácid/i.test(subject)){fact='Los aminoácidos esenciales participan en la síntesis de proteínas. La utilidad de suplementarlos depende, entre otras cosas, de la proteína total de tu alimentación.';tip='Antes de añadir otro suplemento, revisa si tu dieta ya cubre tus necesidades.';question='¿Conoces la diferencia entre EAA y BCAA?'}
    else if(/sueño|descanso|recuperación/i.test(subject)){fact='El descanso forma parte del entrenamiento. Dormir bien y gestionar la carga ayudan a recuperarte entre sesiones.';tip='No confundas entrenar más días con progresar necesariamente más.';question='¿Cuántas horas sueles dormir?'}
    else if(/entren|fuerza|hipertrofia|piernas|espalda|hombros|bíceps|tríceps|pantorrillas|series|cargas|técnica|calentamiento|gimnasio/i.test(subject)){fact='Progresar en el gimnasio depende de una técnica adecuada, una carga que puedas controlar y una rutina sostenible.';tip='Registra tu entrenamiento y mejora gradualmente, sin sacrificar la ejecución.';question='¿Qué parte de tu rutina te cuesta más mejorar?'}
    else if(/disciplina|constancia|motivación|solo/i.test(subject)){fact='La disciplina se construye repitiendo hábitos realistas, incluso cuando no hay motivación.';tip='Una sesión consistente vale más que un plan perfecto que nunca se cumple.';question='¿Qué hábito te ayuda a no abandonar?'}
    else if(/etiqueta|registro|precio|porción|almacenamiento|sabores|presentaciones|comparar/i.test(subject)){fact='Leer la etiqueta permite comparar ingredientes, cantidades por porción, presentación y recomendaciones del fabricante.';tip='No elijas solo por el tamaño del envase o por una frase llamativa del empaque.';question='¿Qué revisas primero antes de comprar?'}
    else if(/hidratación|electrolito/i.test(subject)){fact='Las necesidades de líquidos varían según la actividad, el clima y la sudoración. No todas las sesiones requieren bebidas con electrolitos.';tip='Considera la duración e intensidad del ejercicio y tus condiciones individuales.';question='¿Llevas agua a todos tus entrenamientos?'}
    else if(/carbohidrato|déficit|superávit|nutrición|alimentación/i.test(subject)){fact='La alimentación y la energía disponible influyen en el rendimiento y la recuperación. No existe una estrategia idéntica para todas las personas.';tip='Ajusta tus decisiones a tus objetivos y evita las reglas extremas.';question='¿Qué parte de tu alimentación te gustaría entender mejor?'}
    else {fact='Comprender para qué sirve cada opción y en qué contexto puede ser útil ayuda a tomar decisiones más informadas.';tip='Revisa la evidencia, las indicaciones del fabricante y tus necesidades antes de cambiar hábitos.';question='¿Qué duda tienes sobre este tema?'}
    const hooks={
     'Educativo':'Lo esencial sobre '+lower+' 📚',
     'Mitos y realidades':'¿Mito o realidad? Hablemos de '+lower+' 🔎',
     'Comparación':'Antes de comparar opciones de '+lower+', lee esto 👇',
     'Errores comunes':'Un error común al hablar de '+lower+' ⚠️',
     'Preguntas frecuentes':'Resolvamos dudas sobre '+lower+' 💬',
     'Consejo práctico':'Un consejo práctico sobre '+lower+' 💡',
     'Disciplina y motivación':'La constancia se entrena. Hoy hablamos de '+lower+' 💪',
     'Interacción':'Queremos conocer tu opinión sobre '+lower+' 👇',
     'Producto protagonista':'Antes de elegir un producto relacionado con '+lower+' 🔍',
     'Guía de compra':'Guía rápida para entender '+lower+' 🛒',
     'Dato curioso':'Un dato interesante sobre '+lower+' 🧠',
     'Verdadero o falso':'¿Verdadero o falso? '+subject+' 🤔',
     'Paso a paso':'Tres pasos para entender '+lower+' 📌',
     'Checklist':'Lista rápida para revisar '+lower+' ✅',
     'Antes y después de aprender':'Lo que muchos creen sobre '+lower+' y lo que conviene saber.',
     'Glosario fitness':'Diccionario fitness: '+subject+' 📖',
     'Caso hipotético':'Imagina que estás aprendiendo sobre '+lower+'...',
     'Reto semanal':'Reto de la semana: aprende algo nuevo sobre '+lower+' 💪',
     'Encuesta':'Encuesta rápida: '+subject+' 📊',
     'Carrusel educativo':'Desliza para entender mejor '+lower+' 👉',
     'Mini guía':'Mini guía: '+subject+' 📋',
     'Lo que dice la evidencia':'¿Qué sabemos realmente sobre '+lower+'? 🔬',
     'Señales para revisar':'Antes de decidir sobre '+lower+', revisa esto.',
     'Hábitos de entrenamiento':'Pequeños hábitos, mejores rutinas: '+subject,
     'Preguntas para tu entrenador':'Preguntas que vale la pena hacer sobre '+lower+' 💬'
    };
    const intro=hooks[kind]||'Aprendamos sobre '+lower;
    const middle=/Errores|Checklist|Guía|Paso a paso|Señales|compra/i.test(kind)?tip+'\n\n'+fact:fact+'\n\n'+tip;
    const closing=/Interacción|Encuesta|Preguntas/i.test(kind)?question+' Cuéntanos en comentarios. 👇':question;
    const hashtags=/entren|gimnasio|disciplina|fuerza|hipertrofia|series/i.test(subject)?'#Entrenamiento #DisciplinaFitness #Gimnasio #SUPGO':'#NutricionDeportiva #Suplementos #EducacionFitness #SUPGO';
    return intro+'\n\n'+middle+'\n\n'+closing+'\n\n'+hashtags;
   }
   const schedule=document.createElement('div');schedule.style.cssText='border-top:1px solid #eee;margin-top:15px;padding-top:12px';
   const scheduleTitle=document.createElement('strong');scheduleTitle.textContent='Ideas para el día';scheduleTitle.style.cssText='display:block;margin-bottom:8px;font-size:13px';
   const slotList=document.createElement('div');
   schedule.append(scheduleTitle,slotList);
   function buildPrompt(typeIndex,themeIndex,period){
    const t=types[typeIndex],subject=extra.value.trim()||themes[themeIndex],productName=[selected.nombre,selected.marca].filter(Boolean).join(' · ');
    const showProduct=t[0]==='Producto protagonista';
    const dimensions=period==='noche'?'historia de Instagram o estado de WhatsApp, formato 9:16 (1080 × 1920 px)':'publicación de Instagram, formato 4:5 (1080 × 1350 px)';
    return '@Estados: Crea una imagen para '+dimensions+'. Tipo de contenido: '+t[0]+'. Tema: '+subject+'. Enfoque: '+t[1]+' '+(showProduct?'Usa la fotografía original del producto '+productName+'; respeta fielmente envase, marca, etiqueta y sabor. ':'No fuerces la inclusión del producto; prioriza el tema.')+' Utiliza la programación y estilo visual que ya tenemos definidos. Una sola idea principal, composición limpia, gancho breve y poco texto. No inventes datos, testimonios, afirmaciones nutricionales ni logos. No incluyas precios salvo que se soliciten. Entrega una sola imagen lista para publicar.';
   }
   function update(){prompt.value=buildPrompt(Number(typeSelect.value),Number(themeSelect.value),moment.value);copy.textContent='Copiar prompt';caption.value=makeCaption();captionButton.textContent='Copiar copy'}
   function renderSlots(){
    slotList.replaceChildren();
    const d=Number(day.value);
    const combinations=[[d%types.length,(d*2)%themes.length,'mañana'],[(d+8)%types.length,(d*2+4)%themes.length,'tarde'],[(d+7)%types.length,(d*2+8)%themes.length,'noche']];
    combinations.forEach(([ti,th,period])=>{const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;align-items:center;justify-content:space-between;border-bottom:1px solid #f0f0f0;padding:8px 0';const info=document.createElement('span');info.style.cssText='font-size:12px;flex:1';info.textContent=(period==='mañana'?'Mañana':period==='tarde'?'Tarde':'Noche')+' · '+types[ti][0]+' / '+themes[th];const choose=button('Usar',()=>{typeSelect.value=String(ti);themeSelect.value=String(th);extra.value='';moment.value=period;update()});row.append(info,choose);slotList.append(row)})
   }
   typeSelect.onchange=update;themeSelect.onchange=()=>{extra.value='';update()};extra.oninput=update;moment.onchange=update;day.onchange=renderSlots;
   plan.append(title,hint,layout,dayRow,promptLabel,prompt,actions,captionArea,schedule);educationPanel.append(plan);renderSlots();update();

 }
 renderEducation();
 const items=await loadCatalog();if(!ui.root.isConnected)return;
 renderLaboratorySEO(laboratoryPanel,items);
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
   const linkBox=document.createElement('div');linkBox.style.cssText='margin-top:14px;border:1px solid #e7e7e7;border-radius:12px;padding:12px';
   const linkTitle=document.createElement('strong');linkTitle.textContent='Enlace para historia de Instagram';linkTitle.style.cssText='display:block;margin-bottom:8px;font-weight:500';
   const linkField=document.createElement('input');linkField.readOnly=true;linkField.setAttribute('aria-label','Enlace del producto');linkField.style.cssText='width:100%;box-sizing:border-box;padding:10px;border:1px solid #ddd;border-radius:8px;font:inherit';
   const sticker=document.createElement('input');sticker.setAttribute('aria-label','Texto del sticker de Instagram');sticker.value='Ver precio y sabores';sticker.style.cssText='width:100%;box-sizing:border-box;padding:10px;border:1px solid #ddd;border-radius:8px;font:inherit;margin-top:8px';
   const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:9px';
   const rawUrl=value(selected,'url_producto','product_url','url','enlace');
   let verified='';
   const candidates=[rawUrl,typeof window.liftStaticProductUrl==='function'?window.liftStaticProductUrl(selected):'',typeof window.liftPublicProductUrl==='function'?window.liftPublicProductUrl(selected):''];
   for(const candidate of candidates){if(!candidate)continue;try{const u=new URL(String(candidate),'https://supgo.co');if((u.hostname==='supgo.co'||u.hostname==='www.supgo.co')&&u.pathname.startsWith('/productos/')){verified=u.toString();break}}catch{}}
   if(!verified&&selected.id&&selected.nombre&&typeof window.seoSlug==='function'){
    const slug=window.seoSlug(selected.nombre);if(slug)verified='https://supgo.co/productos/'+slug+'-'+encodeURIComponent(String(selected.id))+'.html';
   }
   linkField.value=verified||'Este producto no tiene una URL individual confirmada';
   const copyText=async(text,b)=>{try{await navigator.clipboard.writeText(text)}catch{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();document.execCommand('copy');t.remove()}b.textContent='Copiado ✓'};
   const copyLink=button('Copiar enlace para historia',()=>copyText(linkField.value,copyLink),true);
   copyLink.disabled=!verified;
   const copySticker=button('Copiar texto del sticker',()=>copyText(sticker.value,copySticker));
   actions.append(copyLink,copySticker);
   linkBox.append(linkTitle,linkField,sticker,actions);
   if(!verified){const warning=document.createElement('small');warning.textContent='Falta la URL de la ficha de este producto. No se generará un enlace inventado.';warning.style.cssText='display:block;color:#a55;margin-top:8px';linkBox.append(warning)}
   editor.append(linkBox);
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

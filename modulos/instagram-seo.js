/* SUPGO | Instagram SEO
   Integración: window.LiftInstagramSEO.open(producto)
   Producto: {id,nombre,marca,categoria,imagen,slug,product}
   No publica en Instagram ni inventa precios o existencias.
*/
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const hashtag = s => clean(s).replace(/\s+/g,'');
  function generate(p, objective='ventas', variant=0) {
    const nombre=String(p.nombre || p.product?.nombre || p.product?.name || '').trim();
    if (!nombre) throw new Error('El producto debe tener nombre.');
    const marca=String(p.marca || p.brand || p.product?.marca || p.product?.brand || '').trim();
    const precioRaw=p.precio??p.price??p.product?.precio??p.product?.price;
    const precio=precioRaw!=null&&precioRaw!==''&&Number(precioRaw)>0?('$'+Number(precioRaw).toLocaleString('es-CO')):'';
    const productoCompleto=[nombre,marca].filter(Boolean).join(' · ');
    const categoria=String(p.categoria||p.category||p.product?.categoria||'suplementos deportivos').trim();
    const titulo=[nombre,marca,precio].filter(Boolean).join(' - ');
    // Usar solo una URL real aportada por el catálogo; no construir slugs hipotéticos.
    const candidates=[p.url_producto,p.product_url,p.url,p.enlace,p.product?.url_producto,p.product?.url,p.product?.enlace];
    const url=candidates.find(u=>{try{const x=new URL(u);return x.protocol==='https:' && /(^|\.)supgo\.co$/i.test(x.hostname) && x.pathname!=='/'}catch{return false}})||'https://supgo.co';
    const intros={
      ventas:['¿Buscas '+productoCompleto+' en Medellín?','Encuentra información de '+productoCompleto+' en SUPGO.','Tu próximo suplemento puede estar en nuestro catálogo: '+productoCompleto+'.'],
      educativo:['¿Qué debes revisar antes de elegir '+productoCompleto+'?','Conoce mejor '+productoCompleto+' antes de comprar.','Hoy te mostramos '+productoCompleto+' y cómo consultar sus características.'],
      alcance:['¿Ya conocías '+productoCompleto+'?','Si buscas '+productoCompleto+' en Medellín, esta publicación es para ti.','Una opción para explorar en suplementos deportivos: '+productoCompleto+'.']
    };
    const index=((Number(variant)||0)%3+3)%3;
    const intro=(intros[objective]||intros.ventas)[index];
    const bodies=[
      'Consulta la presentación, características y detalles de '+productoCompleto+' directamente con SUPGO.',
      'Antes de elegir tu suplemento, revisa su presentación y composición. En SUPGO te ayudamos a consultar la información de '+productoCompleto+'.',
      'Si estás comparando opciones para tu entrenamiento, conoce los detalles de '+productoCompleto+' en nuestro catálogo.'
    ];
    const endings=[
      '📍 Atención en Medellín y envíos a Colombia.\n📲 Escríbenos para confirmar precio y disponibilidad.',
      '📦 Consulta opciones de envío desde Medellín.\n💬 Pide información y cotización por mensaje.',
      '🛒 Explora SUPGO y consulta las condiciones de compra.\n📩 Escríbenos para verificar disponibilidad.'
    ];
    const descripcion=[intro,bodies[index],endings[index],'🔗 '+url].join('\n\n');
    const hashtags=[nombre,marca,categoria,'SuplementosMedellin','SUPGO'].filter(Boolean).map(x=>'#'+hashtag(x)).filter((x,i,a)=>x.length>1&&a.indexOf(x)===i).slice(0,8).join(' ');
    const alt='Imagen de '+nombre+(marca?' de '+marca:'')+', suplemento del catálogo SUPGO en Medellín.';
    const reel=['0–3 s: Muestra el producto y escribe '+productoCompleto+'.','3–9 s: Enfoca la presentación y los datos reales de su etiqueta.','9–15 s: Explica una característica comprobable, sin prometer resultados.','15–20 s: Invita a consultar precio y disponibilidad en SUPGO.'].join('\n');
    return {titulo,descripcion:descripcion+'\n\n'+hashtags,alt};
  }
  function open(producto) {
    const existing=document.getElementById('lift-instagram-seo-modal'); if(existing)existing.remove();
    const root=document.createElement('div'); root.id='lift-instagram-seo-modal';
    root.style.cssText='position:fixed;inset:0;background:#1119;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
    root.innerHTML='<section role="dialog" aria-modal="true" aria-label="Instagram SEO" style="background:#fff;color:#171717;max-width:720px;width:100%;max-height:92vh;overflow:auto;border-radius:20px;padding:clamp(18px,4vw,30px);box-shadow:0 24px 70px #0003;font:400 13px Poppins,Arial,sans-serif"><header style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div style="font-size:11px;color:#777;letter-spacing:.07em">SUPGO · CONTENIDO</div><h2 style="margin:4px 0 0;font-size:21px;font-weight:600">Publicación Instagram</h2></div><button type="button" data-close aria-label="Cerrar" style="border:1px solid #eee;border-radius:50%;width:34px;height:34px;background:#fafafa;cursor:pointer">✕</button></header><p style="color:#777;margin:12px 0 18px">Tres campos listos para copiar y publicar.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px"><label style="flex:1;min-width:130px;color:#555">Objetivo<select data-objective style="display:block;width:100%;margin-top:6px;padding:10px;border:1px solid #e2e2e2;border-radius:9px;background:white;font:inherit"><option value="ventas">Ventas</option><option value="educativo">Educativo</option><option value="alcance">Alcance</option></select></label><label style="flex:1;min-width:130px;color:#555">Estilo<select data-variant style="display:block;width:100%;margin-top:6px;padding:10px;border:1px solid #e2e2e2;border-radius:9px;background:white;font:inherit"><option value="0">Directo</option><option value="1">Asesoría</option><option value="2">Descubrimiento</option></select></label></div><div data-fields></div></section>';
    document.body.appendChild(root);
    root.querySelector('[data-close]').onclick=()=>root.remove();
    root.onclick=e=>{if(e.target===root)root.remove()};
    function render(){
      const o=generate(producto,root.querySelector('[data-objective]').value,Number(root.querySelector('[data-variant]').value));
      const fields=root.querySelector('[data-fields]');fields.replaceChildren();
      const configs=[
        ['titulo','Nombre · Marca · Precio',2],
        ['descripcion','Descripción + hashtags',8],
        ['alt','Texto alternativo',3]
      ];
      for(const [key,labelText,rows] of configs){
        const wrap=document.createElement('div');wrap.style.cssText='border:1px solid #ececec;border-radius:13px;padding:13px;margin-top:11px;background:#fff';
        const header=document.createElement('div');header.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:9px';
        const label=document.createElement('label');label.textContent=labelText;label.style.cssText='font-size:13px;font-weight:600;color:#222';
        const area=document.createElement('textarea');area.value=o[key]||'';area.rows=rows;area.setAttribute('aria-label',labelText);area.style.cssText='display:block;box-sizing:border-box;width:100%;padding:11px;border:1px solid #e8e8e8;border-radius:9px;background:#fafafa;color:#222;resize:vertical;font:400 13px/1.65 Poppins,Arial,sans-serif';
        const btn=document.createElement('button');btn.textContent='Copiar';btn.type='button';btn.style.cssText='border:0;border-radius:8px;background:#111;color:#fff;padding:8px 15px;cursor:pointer;font:500 12px Poppins,Arial';
        btn.onclick=async()=>{try{await navigator.clipboard.writeText(area.value)}catch{area.focus();area.select();document.execCommand('copy')}btn.textContent='Copiado ✓';setTimeout(()=>btn.textContent='Copiar',1800)};
        header.append(label,btn);wrap.append(header,area);fields.append(wrap);
      }
    }
    root.querySelector('[data-objective]').onchange=render;root.querySelector('[data-variant]').onchange=render;render();
  }
  async function openSelector(){
    const prev=document.getElementById('lift-ig-product-selector');if(prev)prev.remove();
    const overlay=document.createElement('div');overlay.id='lift-ig-product-selector';
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#0009;display:grid;place-items:center;padding:16px';
    const panel=document.createElement('section');panel.style.cssText='background:white;color:#111;border-radius:14px;padding:22px;width:min(560px,100%);max-height:85vh;overflow:auto;font:14px Poppins,Arial,sans-serif';
    panel.innerHTML='<h2>Instagram SEO · Productos</h2><p>Selecciona un producto del catálogo para generar su publicación.</p><input aria-label="Buscar producto" placeholder="Buscar por nombre o marca" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:8px;box-sizing:border-box"><div data-results style="margin-top:12px"></div><button data-close type="button" style="margin-top:12px">Cerrar</button>';
    overlay.appendChild(panel);document.body.appendChild(overlay);
    overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
    panel.querySelector('[data-close]').onclick=()=>overlay.remove();
    const results=panel.querySelector('[data-results]'),input=panel.querySelector('input');
    let products=[];
    const normalizeProduct=p=>{
      const raw=p&&typeof p==='object'?p:{};
      const nested=raw.product&&typeof raw.product==='object'?raw.product:{};
      return {
        ...raw,
        nombre:raw.nombre||raw.name||raw.title||nested.nombre||nested.name||nested.title||'',
        marca:raw.marca||raw.brand||nested.marca||nested.brand||'',
        categoria:raw.categoria||raw.category||nested.categoria||nested.category||'',
        imagen:raw.imagen||raw.image||nested.imagen||nested.image||'',
        sabor:raw.sabor||raw.flavor||nested.sabor||nested.flavor||'',
        presentacion:raw.presentacion||raw.presentation||nested.presentacion||nested.presentation||'',
        slug:raw.slug||nested.slug||'',
        id:raw.id||nested.id
      };
    };
    const local=window.PRODUCTS;
    if(Array.isArray(local))products=local.map(normalizeProduct).filter(p=>p.nombre);
    else if(local&&typeof local==='object')products=Object.values(local).map(normalizeProduct).filter(p=>p.nombre);
    if(!products.length){
      const clients=[window.supabaseClient,window.supabase,window.sb,window.liftSupabase,window._supabase].filter(x=>x&&typeof x.from==='function');
      for(const client of clients){
        try{
          const res=await client.from('lift_productos').select('id,nombre,marca,categoria,product').eq('activo',true).limit(1000);
          if(!res.error&&Array.isArray(res.data)){products=res.data.map(normalizeProduct).filter(p=>p.nombre);break}
        }catch(e){console.warn('Instagram SEO: catálogo no disponible',e)}
      }
    }
    // Vista previa y compartir: reutiliza el generador oficial de fichas de SUPGO.
    const preview=document.createElement('div');
    preview.style.cssText='display:none;margin:14px 0;padding:14px;border:1px solid #e5e5e5;border-radius:12px;background:#fafafa';
    results.before(preview);
    function showPreview(p){
      preview.replaceChildren();preview.style.display='block';
      const head=document.createElement('div');head.style.cssText='display:flex;gap:14px;align-items:center';
      const img=document.createElement('img');
      const getImage=x=>x.imagen||x.image||x.imagen_url||x.foto||x.product?.imagen||x.product?.image||'';
      const src=getImage(p);if(src){img.src=src;img.alt=p.nombre;img.style.cssText='width:110px;height:125px;object-fit:contain;background:white;border-radius:9px';head.append(img);}
      const details=document.createElement('div');details.style.cssText='flex:1;min-width:0';
      const title=document.createElement('strong');title.textContent=p.nombre;
      const brand=document.createElement('div');brand.textContent=p.marca||'';brand.style.cssText='font-size:12px;color:#666;margin:5px 0';
      details.append(title,brand);head.append(details);preview.append(head);
      const matching=products.filter(x=>x.id!==p.id&&clean(x.nombre).toLowerCase()===clean(p.nombre).toLowerCase());
      const options=[p,...matching].filter(x=>x.id!=null);
      let selected=p;
      if(options.length>1){
        const label=document.createElement('label');label.textContent='Sabor / presentación';label.style.cssText='display:block;margin-top:12px';
        const select=document.createElement('select');select.style.cssText='width:100%;padding:10px;border:1px solid #ddd;border-radius:8px';
        options.forEach((x,i)=>{const op=document.createElement('option');op.value=String(i);op.textContent=x.sabor||x.flavor||x.presentacion||x.presentation||x.nombre+' · '+(i+1);select.append(op)});
        select.onchange=()=>{selected=options[Number(select.value)];const url=getImage(selected);if(url){img.src=url;if(!img.isConnected)head.prepend(img)}};
        label.append(select);preview.append(label);
      }
      const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:14px';
      const share=document.createElement('button');share.type='button';share.textContent='Compartir imagen';share.style.cssText='background:#111;color:white;border:0;border-radius:9px;padding:11px 16px;cursor:pointer;font:500 13px Poppins,Arial';
      share.onclick=async()=>{
        if(typeof window.shareLiftProductImage!=='function'){alert('El generador de imágenes del catálogo no está disponible.');return;}
        if(selected.id==null){alert('Este producto no tiene identificador de catálogo.');return;}
        const old=share.textContent;share.disabled=true;share.textContent='Preparando imagen…';
        try{await window.shareLiftProductImage(selected.id)}
        catch(e){console.error(e);alert('No se pudo generar la imagen: '+(e.message||e))}
        finally{share.disabled=false;share.textContent=old}
      };
      const seo=document.createElement('button');seo.type='button';seo.textContent='Crear publicación SEO';seo.style.cssText='background:white;border:1px solid #ccc;border-radius:9px;padding:11px 16px;cursor:pointer;font:500 13px Poppins,Arial';
      seo.onclick=()=>{overlay.remove();open(selected)};
      actions.append(share,seo);preview.append(actions);
      const note=document.createElement('small');note.textContent='La imagen se genera con el diseño de la ficha y las opciones de compartir de tu dispositivo. @Estados requiere adjuntar la imagen si no admite recepción directa.';note.style.cssText='display:block;color:#777;margin-top:9px';preview.append(note);
    }
    function render(){
      results.replaceChildren();const term=clean(input.value).toLowerCase();
      const filtered=products.filter(p=>clean([p.nombre,p.marca].join(' ')).toLowerCase().includes(term)).slice(0,40);
      if(!products.length){
        const msg=document.createElement('p');msg.textContent='No se pudo acceder al catálogo desde esta vista. Escribe el nombre del producto manualmente.';results.appendChild(msg);
        const manual=document.createElement('button');manual.textContent='Usar nombre manual';manual.onclick=()=>{const nombre=input.value.trim();if(!nombre){input.focus();return}overlay.remove();open({nombre})};results.appendChild(manual);return;
      }
      if(!filtered.length){results.textContent='No se encontraron productos';return}
      for(const p of filtered){const b=document.createElement('button');b.type='button';b.textContent=[p.nombre,p.marca].filter(Boolean).join(' · ');b.style.cssText='display:block;width:100%;text-align:left;padding:10px;margin:4px 0;background:#f8f8f8;border:1px solid #ddd;border-radius:8px;cursor:pointer';b.onclick=()=>{showPreview(p)};results.appendChild(b)}
    }
    input.addEventListener('input',render);render();input.focus();
  }
  window.LiftInstagramSEO={generate,open,openSelector};
})();+Number(precioRaw).toLocaleString('es-CO'):'';
    const productoCompleto=[nombre,marca].filter(Boolean).join(' · ');
    const categoria=String(p.categoria || p.product?.categoria || 'suplementos deportivos').trim();
    const titulo=nombre+' en Medellín';
    const clave=nombre+' Medellín';
    // Usar solo una URL real aportada por el catálogo; no construir slugs hipotéticos.
    const candidates=[p.url_producto,p.product_url,p.url,p.enlace,p.product?.url_producto,p.product?.url,p.product?.enlace];
    const url=candidates.find(u=>{try{const x=new URL(u);return x.protocol==='https:' && /(^|\.)supgo\.co$/i.test(x.hostname) && x.pathname!=='/'}catch{return false}})||'https://supgo.co';
    const intros={
      ventas:['¿Buscas '+productoCompleto+' en Medellín?','Encuentra información de '+productoCompleto+' en SUPGO.','Tu próximo suplemento puede estar en nuestro catálogo: '+productoCompleto+'.'],
      educativo:['¿Qué debes revisar antes de elegir '+productoCompleto+'?','Conoce mejor '+productoCompleto+' antes de comprar.','Hoy te mostramos '+productoCompleto+' y cómo consultar sus características.'],
      alcance:['¿Ya conocías '+productoCompleto+'?','Si buscas '+productoCompleto+' en Medellín, esta publicación es para ti.','Una opción para explorar en suplementos deportivos: '+productoCompleto+'.']
    };
    const index=((Number(variant)||0)%3+3)%3;
    const intro=(intros[objective]||intros.ventas)[index];
    const bodies=[
      'Consulta la presentación, características y detalles de '+productoCompleto+' directamente con SUPGO.',
      'Antes de elegir tu suplemento, revisa su presentación y composición. En SUPGO te ayudamos a consultar la información de '+productoCompleto+'.',
      'Si estás comparando opciones para tu entrenamiento, conoce los detalles de '+productoCompleto+' en nuestro catálogo.'
    ];
    const endings=[
      '📍 Atención en Medellín y envíos a Colombia.\n📲 Escríbenos para confirmar precio y disponibilidad.',
      '📦 Consulta opciones de envío desde Medellín.\n💬 Pide información y cotización por mensaje.',
      '🛒 Explora SUPGO y consulta las condiciones de compra.\n📩 Escríbenos para verificar disponibilidad.'
    ];
    const descripcion=[intro,bodies[index],endings[index],'🔗 '+url].join('\n\n');
    const hashtags=[nombre,marca,categoria,'SuplementosMedellin','SUPGO'].filter(Boolean).map(x=>'#'+hashtag(x)).filter((x,i,a)=>x.length>1&&a.indexOf(x)===i).slice(0,8).join(' ');
    const alt='Imagen de '+nombre+(marca?' de '+marca:'')+', suplemento del catálogo SUPGO en Medellín.';
    const reel=['0–3 s: Muestra el producto y escribe '+productoCompleto+'.','3–9 s: Enfoca la presentación y los datos reales de su etiqueta.','9–15 s: Explica una característica comprobable, sin prometer resultados.','15–20 s: Invita a consultar precio y disponibilidad en SUPGO.'].join('\n');
    return {titulo,clave,relacionadas:[nombre,marca?marca+' Colombia':'Suplementos Colombia',categoria+' Medellín','Comprar '+nombre].filter(Boolean),descripcion,hashtags,alt,reel,url};
  }
  function open(producto) {
    const existing=document.getElementById('lift-instagram-seo-modal'); if(existing)existing.remove();
    const root=document.createElement('div'); root.id='lift-instagram-seo-modal';
    root.style.cssText='position:fixed;inset:0;background:#0008;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px';
    root.innerHTML='<section role="dialog" aria-modal="true" aria-label="Instagram SEO" style="background:white;color:#111;max-width:650px;width:100%;max-height:92vh;overflow:auto;border-radius:14px;padding:22px;font:14px Arial,sans-serif"><header style="display:flex;justify-content:space-between;align-items:center"><h2>Instagram SEO</h2><button type="button" data-close>Cerrar ✕</button></header><label>Objetivo <select data-objective><option value="ventas">Ventas</option><option value="educativo">Educativo</option><option value="alcance">Alcance</option></select></label><label style="display:block;margin-top:12px">Estilo <select data-variant><option value="0">Directo</option><option value="1">Asesoría</option><option value="2">Descubrimiento</option></select></label><div data-fields></div></section>';
    document.body.appendChild(root);
    root.querySelector('[data-close]').onclick=()=>root.remove();
    root.onclick=e=>{if(e.target===root)root.remove()};
    function render(){
      const o=generate(producto,root.querySelector('[data-objective]').value,Number(root.querySelector('[data-variant]').value));
      const fields=root.querySelector('[data-fields]');fields.innerHTML='';
      for(const [key,value] of Object.entries(o)){
        const label=document.createElement('label');label.style.cssText='display:block;font-weight:bold;margin-top:14px';label.textContent=({titulo:'Título',clave:'Frase clave',relacionadas:'Palabras relacionadas',descripcion:'Descripción Instagram',hashtags:'Hashtags',alt:'Texto alternativo',reel:'Guion Reel',url:'Enlace producto'})[key]||key;
        const area=document.createElement('textarea');area.value=Array.isArray(value)?value.join(', '):value;area.rows=['descripcion','reel'].includes(key)?6:2;area.style.cssText='box-sizing:border-box;width:100%;padding:9px;margin-top:5px;border:1px solid #ccc;border-radius:7px;font:inherit';
        const btn=document.createElement('button');btn.textContent='Copiar';btn.type='button';btn.style.cssText='margin:5px 0;padding:6px 14px';btn.onclick=async()=>{try{await navigator.clipboard.writeText(area.value);btn.textContent='Copiado ✓'}catch{area.select();document.execCommand('copy');btn.textContent='Copiado'}};
        fields.append(label,area,btn);
      }
    }
    root.querySelector('[data-objective]').onchange=render;root.querySelector('[data-variant]').onchange=render;render();
  }
  async function openSelector(){
    const prev=document.getElementById('lift-ig-product-selector');if(prev)prev.remove();
    const overlay=document.createElement('div');overlay.id='lift-ig-product-selector';
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#0009;display:grid;place-items:center;padding:16px';
    const panel=document.createElement('section');panel.style.cssText='background:white;color:#111;border-radius:14px;padding:22px;width:min(560px,100%);max-height:85vh;overflow:auto;font:14px Poppins,Arial,sans-serif';
    panel.innerHTML='<h2>Instagram SEO · Productos</h2><p>Selecciona un producto del catálogo para generar su publicación.</p><input aria-label="Buscar producto" placeholder="Buscar por nombre o marca" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:8px;box-sizing:border-box"><div data-results style="margin-top:12px"></div><button data-close type="button" style="margin-top:12px">Cerrar</button>';
    overlay.appendChild(panel);document.body.appendChild(overlay);
    overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
    panel.querySelector('[data-close]').onclick=()=>overlay.remove();
    const results=panel.querySelector('[data-results]'),input=panel.querySelector('input');
    let products=[];
    const normalizeProduct=p=>{
      const raw=p&&typeof p==='object'?p:{};
      const nested=raw.product&&typeof raw.product==='object'?raw.product:{};
      return {
        ...raw,
        nombre:raw.nombre||raw.name||raw.title||nested.nombre||nested.name||nested.title||'',
        marca:raw.marca||raw.brand||nested.marca||nested.brand||'',
        categoria:raw.categoria||raw.category||nested.categoria||nested.category||'',
        imagen:raw.imagen||raw.image||nested.imagen||nested.image||'',
        sabor:raw.sabor||raw.flavor||nested.sabor||nested.flavor||'',
        presentacion:raw.presentacion||raw.presentation||nested.presentacion||nested.presentation||'',
        slug:raw.slug||nested.slug||'',
        id:raw.id||nested.id
      };
    };
    const local=window.PRODUCTS;
    if(Array.isArray(local))products=local.map(normalizeProduct).filter(p=>p.nombre);
    else if(local&&typeof local==='object')products=Object.values(local).map(normalizeProduct).filter(p=>p.nombre);
    if(!products.length){
      const clients=[window.supabaseClient,window.supabase,window.sb,window.liftSupabase,window._supabase].filter(x=>x&&typeof x.from==='function');
      for(const client of clients){
        try{
          const res=await client.from('lift_productos').select('id,nombre,marca,categoria,product').eq('activo',true).limit(1000);
          if(!res.error&&Array.isArray(res.data)){products=res.data.map(normalizeProduct).filter(p=>p.nombre);break}
        }catch(e){console.warn('Instagram SEO: catálogo no disponible',e)}
      }
    }
    // Vista previa y compartir: reutiliza el generador oficial de fichas de SUPGO.
    const preview=document.createElement('div');
    preview.style.cssText='display:none;margin:14px 0;padding:14px;border:1px solid #e5e5e5;border-radius:12px;background:#fafafa';
    results.before(preview);
    function showPreview(p){
      preview.replaceChildren();preview.style.display='block';
      const head=document.createElement('div');head.style.cssText='display:flex;gap:14px;align-items:center';
      const img=document.createElement('img');
      const getImage=x=>x.imagen||x.image||x.imagen_url||x.foto||x.product?.imagen||x.product?.image||'';
      const src=getImage(p);if(src){img.src=src;img.alt=p.nombre;img.style.cssText='width:110px;height:125px;object-fit:contain;background:white;border-radius:9px';head.append(img);}
      const details=document.createElement('div');details.style.cssText='flex:1;min-width:0';
      const title=document.createElement('strong');title.textContent=p.nombre;
      const brand=document.createElement('div');brand.textContent=p.marca||'';brand.style.cssText='font-size:12px;color:#666;margin:5px 0';
      details.append(title,brand);head.append(details);preview.append(head);
      const matching=products.filter(x=>x.id!==p.id&&clean(x.nombre).toLowerCase()===clean(p.nombre).toLowerCase());
      const options=[p,...matching].filter(x=>x.id!=null);
      let selected=p;
      if(options.length>1){
        const label=document.createElement('label');label.textContent='Sabor / presentación';label.style.cssText='display:block;margin-top:12px';
        const select=document.createElement('select');select.style.cssText='width:100%;padding:10px;border:1px solid #ddd;border-radius:8px';
        options.forEach((x,i)=>{const op=document.createElement('option');op.value=String(i);op.textContent=x.sabor||x.flavor||x.presentacion||x.presentation||x.nombre+' · '+(i+1);select.append(op)});
        select.onchange=()=>{selected=options[Number(select.value)];const url=getImage(selected);if(url){img.src=url;if(!img.isConnected)head.prepend(img)}};
        label.append(select);preview.append(label);
      }
      const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:14px';
      const share=document.createElement('button');share.type='button';share.textContent='Compartir imagen';share.style.cssText='background:#111;color:white;border:0;border-radius:9px;padding:11px 16px;cursor:pointer;font:500 13px Poppins,Arial';
      share.onclick=async()=>{
        if(typeof window.shareLiftProductImage!=='function'){alert('El generador de imágenes del catálogo no está disponible.');return;}
        if(selected.id==null){alert('Este producto no tiene identificador de catálogo.');return;}
        const old=share.textContent;share.disabled=true;share.textContent='Preparando imagen…';
        try{await window.shareLiftProductImage(selected.id)}
        catch(e){console.error(e);alert('No se pudo generar la imagen: '+(e.message||e))}
        finally{share.disabled=false;share.textContent=old}
      };
      const seo=document.createElement('button');seo.type='button';seo.textContent='Crear publicación SEO';seo.style.cssText='background:white;border:1px solid #ccc;border-radius:9px;padding:11px 16px;cursor:pointer;font:500 13px Poppins,Arial';
      seo.onclick=()=>{overlay.remove();open(selected)};
      actions.append(share,seo);preview.append(actions);
      const note=document.createElement('small');note.textContent='La imagen se genera con el diseño de la ficha y las opciones de compartir de tu dispositivo. @Estados requiere adjuntar la imagen si no admite recepción directa.';note.style.cssText='display:block;color:#777;margin-top:9px';preview.append(note);
    }
    function render(){
      results.replaceChildren();const term=clean(input.value).toLowerCase();
      const filtered=products.filter(p=>clean([p.nombre,p.marca].join(' ')).toLowerCase().includes(term)).slice(0,40);
      if(!products.length){
        const msg=document.createElement('p');msg.textContent='No se pudo acceder al catálogo desde esta vista. Escribe el nombre del producto manualmente.';results.appendChild(msg);
        const manual=document.createElement('button');manual.textContent='Usar nombre manual';manual.onclick=()=>{const nombre=input.value.trim();if(!nombre){input.focus();return}overlay.remove();open({nombre})};results.appendChild(manual);return;
      }
      if(!filtered.length){results.textContent='No se encontraron productos';return}
      for(const p of filtered){const b=document.createElement('button');b.type='button';b.textContent=[p.nombre,p.marca].filter(Boolean).join(' · ');b.style.cssText='display:block;width:100%;text-align:left;padding:10px;margin:4px 0;background:#f8f8f8;border:1px solid #ddd;border-radius:8px;cursor:pointer';b.onclick=()=>{showPreview(p)};results.appendChild(b)}
    }
    input.addEventListener('input',render);render();input.focus();
  }
  window.LiftInstagramSEO={generate,open,openSelector};
})();
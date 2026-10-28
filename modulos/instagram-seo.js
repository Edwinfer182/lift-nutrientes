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
    const marca=String(p.marca || p.product?.marca || '').trim();
    const categoria=String(p.categoria || p.product?.categoria || 'suplementos deportivos').trim();
    const titulo=nombre+' en Medellín';
    const clave=nombre+' Medellín';
    // Usar solo una URL real aportada por el catálogo; no construir slugs hipotéticos.
    const candidates=[p.url_producto,p.product_url,p.url,p.enlace,p.product?.url_producto,p.product?.url,p.product?.enlace];
    const url=candidates.find(u=>{try{const x=new URL(u);return x.protocol==='https:' && /(^|\.)supgo\.co$/i.test(x.hostname) && x.pathname!=='/'}catch{return false}})||'https://supgo.co';
    const intros={
      ventas:['¿Buscas '+nombre+' en Medellín?','Encuentra información de '+nombre+' en SUPGO.','Tu próximo suplemento puede estar en nuestro catálogo: '+nombre+'.'],
      educativo:['¿Qué debes revisar antes de elegir '+nombre+'?','Conoce mejor '+nombre+' antes de comprar.','Hoy te mostramos '+nombre+' y cómo consultar sus características.'],
      alcance:['¿Ya conocías '+nombre+'?','Si buscas '+nombre+' en Medellín, esta publicación es para ti.','Una opción para explorar en suplementos deportivos: '+nombre+'.']
    };
    const index=((Number(variant)||0)%3+3)%3;
    const intro=(intros[objective]||intros.ventas)[index];
    const bodies=[
      'Consulta la presentación, características y detalles de '+nombre+' directamente con SUPGO.',
      'Antes de elegir tu suplemento, revisa su presentación y composición. En SUPGO te ayudamos a consultar la información de '+nombre+'.',
      'Si estás comparando opciones para tu entrenamiento, conoce los detalles de '+nombre+' en nuestro catálogo.'
    ];
    const endings=[
      '📍 Atención en Medellín y envíos a Colombia.\n📲 Escríbenos para confirmar precio y disponibilidad.',
      '📦 Consulta opciones de envío desde Medellín.\n💬 Pide información y cotización por mensaje.',
      '🛒 Explora SUPGO y consulta las condiciones de compra.\n📩 Escríbenos para verificar disponibilidad.'
    ];
    const descripcion=[intro,bodies[index],endings[index],'🔗 '+url].join('\n\n');
    const hashtags=[nombre,marca,categoria,'SuplementosMedellin','SUPGO'].filter(Boolean).map(x=>'#'+hashtag(x)).filter((x,i,a)=>x.length>1&&a.indexOf(x)===i).slice(0,8).join(' ');
    const alt='Imagen de '+nombre+(marca?' de '+marca:'')+', suplemento del catálogo SUPGO en Medellín.';
    const reel=['0–3 s: Muestra el producto y escribe '+nombre+'.','3–9 s: Enfoca la presentación y los datos reales de su etiqueta.','9–15 s: Explica una característica comprobable, sin prometer resultados.','15–20 s: Invita a consultar precio y disponibilidad en SUPGO.'].join('\n');
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
    function render(){
      results.replaceChildren();const term=clean(input.value).toLowerCase();
      const filtered=products.filter(p=>clean([p.nombre,p.marca].join(' ')).toLowerCase().includes(term)).slice(0,40);
      if(!products.length){
        const msg=document.createElement('p');msg.textContent='No se pudo acceder al catálogo desde esta vista. Escribe el nombre del producto manualmente.';results.appendChild(msg);
        const manual=document.createElement('button');manual.textContent='Usar nombre manual';manual.onclick=()=>{const nombre=input.value.trim();if(!nombre){input.focus();return}overlay.remove();open({nombre})};results.appendChild(manual);return;
      }
      if(!filtered.length){results.textContent='No se encontraron productos';return}
      for(const p of filtered){const b=document.createElement('button');b.type='button';b.textContent=[p.nombre,p.marca].filter(Boolean).join(' · ');b.style.cssText='display:block;width:100%;text-align:left;padding:10px;margin:4px 0;background:#f8f8f8;border:1px solid #ddd;border-radius:8px;cursor:pointer';b.onclick=()=>{overlay.remove();open(p)};results.appendChild(b)}
    }
    input.addEventListener('input',render);render();input.focus();
  }
  window.LiftInstagramSEO={generate,open,openSelector};
})();
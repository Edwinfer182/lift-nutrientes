/* Lift Nutrientes | Instagram SEO
   Integración: window.LiftInstagramSEO.open(producto)
   Producto: {id,nombre,marca,categoria,imagen,slug,product}
   No publica en Instagram ni inventa precios o existencias.
*/
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const hashtag = s => clean(s).replace(/\s+/g,'');
  function generate(p, objective='ventas') {
    const nombre=String(p.nombre || p.product?.nombre || p.product?.name || '').trim();
    if (!nombre) throw new Error('El producto debe tener nombre.');
    const marca=String(p.marca || p.product?.marca || '').trim();
    const categoria=String(p.categoria || p.product?.categoria || 'suplementos deportivos').trim();
    const titulo=nombre+' en Medellín';
    const clave=(marca ? (categoria+' '+marca) : nombre)+' Medellín';
    const url=p.slug ? 'https://supgo.co/productos/'+encodeURIComponent(p.slug)+(p.id ? '-'+encodeURIComponent(p.id) : '')+'.html' : 'https://supgo.co';
    const intro=objective==='educativo' ? 'Conoce las características de '+nombre+'.' : objective==='alcance' ? '¿Buscas información sobre '+nombre+'?' : '¿Buscas '+nombre+' en Medellín?';
    const descripcion=[intro,'En Lift Nutrientes puedes consultar los detalles de '+nombre+' y solicitar información sobre precio y disponibilidad.','Categoría: '+categoria+'.'+(marca?' Marca: '+marca+'.':''),'Atención en Medellín y envíos a Colombia.','Consulta el producto: '+url,'Escríbenos para recibir asesoría y confirmar disponibilidad.'].join('\n\n');
    const hashtags=[nombre,marca,categoria,'SuplementosMedellin','LiftNutrientes'].filter(Boolean).map(x=>'#'+hashtag(x)).filter((x,i,a)=>x.length>1&&a.indexOf(x)===i).slice(0,8).join(' ');
    const alt='Imagen de '+nombre+(marca?' de '+marca:'')+', '+categoria+', en el catálogo de Lift Nutrientes Medellín.';
    const reel=['0–3 s: '+nombre+' en pantalla.','3–9 s: Muestra el envase y su información verificable.','9–15 s: Explica para quién está diseñado según su etiqueta, sin promesas de resultados.','15–20 s: Invita a consultar precio y disponibilidad en Lift Nutrientes.'].join('\n');
    return {titulo,clave,relacionadas:[nombre,marca+' Colombia',categoria+' Medellín','Comprar '+categoria].filter(Boolean),descripcion,hashtags,alt,reel,url};
  }
  function open(producto) {
    const existing=document.getElementById('lift-instagram-seo-modal'); if(existing)existing.remove();
    const root=document.createElement('div'); root.id='lift-instagram-seo-modal';
    root.style.cssText='position:fixed;inset:0;background:#0008;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px';
    root.innerHTML='<section role="dialog" aria-modal="true" aria-label="Instagram SEO" style="background:white;color:#111;max-width:650px;width:100%;max-height:92vh;overflow:auto;border-radius:14px;padding:22px;font:14px Arial,sans-serif"><header style="display:flex;justify-content:space-between;align-items:center"><h2>Instagram SEO</h2><button type="button" data-close>Cerrar ✕</button></header><label>Objetivo <select data-objective><option value="ventas">Ventas</option><option value="educativo">Educativo</option><option value="alcance">Alcance</option></select></label><div data-fields></div></section>';
    document.body.appendChild(root);
    root.querySelector('[data-close]').onclick=()=>root.remove();
    root.onclick=e=>{if(e.target===root)root.remove()};
    function render(){
      const o=generate(producto,root.querySelector('[data-objective]').value);
      const fields=root.querySelector('[data-fields]');fields.innerHTML='';
      for(const [key,value] of Object.entries(o)){
        const label=document.createElement('label');label.style.cssText='display:block;font-weight:bold;margin-top:14px';label.textContent=({titulo:'Título',clave:'Frase clave',relacionadas:'Palabras relacionadas',descripcion:'Descripción Instagram',hashtags:'Hashtags',alt:'Texto alternativo',reel:'Guion Reel',url:'Enlace producto'})[key]||key;
        const area=document.createElement('textarea');area.value=Array.isArray(value)?value.join(', '):value;area.rows=['descripcion','reel'].includes(key)?6:2;area.style.cssText='box-sizing:border-box;width:100%;padding:9px;margin-top:5px;border:1px solid #ccc;border-radius:7px;font:inherit';
        const btn=document.createElement('button');btn.textContent='Copiar';btn.type='button';btn.style.cssText='margin:5px 0;padding:6px 14px';btn.onclick=async()=>{try{await navigator.clipboard.writeText(area.value);btn.textContent='Copiado ✓'}catch{area.select();document.execCommand('copy');btn.textContent='Copiado'}};
        fields.append(label,area,btn);
      }
    }
    root.querySelector('[data-objective]').onchange=render;render();
  }
  window.LiftInstagramSEO={generate,open};
})();
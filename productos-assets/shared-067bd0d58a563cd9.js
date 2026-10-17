
(function(){
 const FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-catalogos-pdf';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 let providers=['Andrés','Cooper 3','Daniel','Evolución Muscular','Golem Nutrition','MAXFITNESS','Mutantes','Suas','Tópico','Vitaness Distribuidor']; // Respaldo: proveedores registrados, no marcas inventadas.
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const auth=()=>sessionStorage.getItem('liftAdminCloudPasswordV1')||'';
 async function api(body){const r=await fetch(FN,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+KEY},body:JSON.stringify({...body,password:auth()})});const j=await r.json().catch(()=>({}));if(!r.ok||j.error)throw Error(j.error||'Error '+r.status);return j}
 window.liftPdfProvidersOpen=async function(){
  if(!auth())return alert('Abre primero la sesión del administrador.');
  document.getElementById('liftPdfAdmin')?.remove();
  const root=document.createElement('div');root.id='liftPdfAdmin';
  root.innerHTML='<div class="liftPdfBox"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">Documentos de proveedores</h3><button id="liftPdfClose" class="liftPdfSecondary">✕ Cerrar</button></div><p style="font-size:11px;color:#666">PDF privados y enlaces externos. Solo para administración.</p><div style="display:flex;gap:8px;margin-bottom:10px"><button id="liftCreateProvider">＋ Crear proveedor</button></div><div id="liftPdfStatus" style="font-size:11px;color:#777">Consultando documentos…</div><div id="liftPdfRows"></div></div>';
  document.body.append(root);root.querySelector('#liftPdfClose').onclick=()=>root.remove();
  // Obtiene la lista real de proveedores registrados en Supabase al abrir la pantalla.
  try{const r=await fetch('https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_proveedores?select=nombre&order=nombre.asc',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});if(r.ok){const list=await r.json();if(Array.isArray(list)&&list.length)providers=[...new Set(list.map(p=>String(p.nombre||'').trim()).filter(Boolean))]}}catch(e){console.warn('Proveedores: usando lista de respaldo',e)}
  const status=root.querySelector('#liftPdfStatus'),rows=root.querySelector('#liftPdfRows');let catalogos=[],enlaces=[];root.querySelector('#liftCreateProvider').onclick=async()=>{const nombre=(prompt('Nombre del nuevo proveedor:')||'').trim();if(!nombre)return;try{await api({action:'create_provider',nombre});providers=[...new Set([...providers,nombre])];await refresh()}catch(e){alert('No se pudo crear el proveedor: '+e.message)}};
  async function refresh(){try{const data=await api({action:'list'});catalogos=data.catalogos||[];enlaces=data.enlaces||[];if(Array.isArray(data.proveedores))providers=data.proveedores.map(p=>p.nombre).filter(Boolean);status.textContent=catalogos.length+' PDF · '+enlaces.length+' enlaces';render()}catch(e){status.textContent='No se pudo conectar con la función de PDF: '+e.message;render()}}
  function render(){
   const names=[...new Set([...providers,...catalogos.map(x=>x.nombre),...enlaces.map(x=>x.nombre)])].sort((a,b)=>a.localeCompare(b,'es'));
   rows.innerHTML=names.map((name,i)=>{
    const docs=catalogos.filter(x=>x.nombre===name);
    const files=docs.map(d=>'<div class="liftPdfDocument"><div><span>📄 '+esc(d.archivo_nombre)+'</span><small>'+new Date(d.actualizado_en).toLocaleDateString('es-CO')+'</small></div><button data-open="'+esc(d.id)+'">Ver PDF</button><button class="liftPdfSecondary" data-replace="'+esc(d.id)+'">Reemplazar</button><button class="liftPdfSecondary" data-delete="'+esc(d.id)+'">Eliminar</button></div>').join('');
    const links=enlaces.filter(x=>x.nombre===name).map(d=>'<div class="liftPdfDocument"><div><span>🔗 '+esc(d.titulo)+'</span><small>'+esc(d.url)+'</small></div><button data-link-open="'+esc(d.id)+'">Abrir enlace</button><button class="liftPdfSecondary" data-link-delete="'+esc(d.id)+'">Eliminar</button></div>').join('');
    return '<section class="liftPdfProvider"><div class="liftPdfProviderHead"><b>'+esc(name)+'</b><div style="display:flex;gap:6px;flex-wrap:wrap"><button data-upload="'+i+'">＋ PDF</button><button data-add-link="'+i+'">＋ Enlace</button></div></div>'+(files+links||'<small>Sin documentos ni enlaces</small>')+'</section>';
   }).join('');
   async function uploadFile(name,oldId){
    const input=document.createElement('input');input.type='file';input.accept='.pdf,application/pdf';
    input.onchange=async()=>{const file=input.files?.[0];if(!file)return;if(!file.name.toLowerCase().endsWith('.pdf')||(file.type&&file.type!=='application/pdf'))return alert('Selecciona un PDF');if(file.size>20*1024*1024)return alert('El PDF supera 20 MB');
     status.textContent='Subiendo '+file.name+'…';
     try{const j=await api({action:'upload',nombre:name,archivo_nombre:file.name});const upload=await fetch(j.upload_url,{method:'PUT',headers:{'Content-Type':'application/pdf'},body:file});if(!upload.ok)throw Error('Falló la subida del PDF ('+upload.status+')');await api({action:'save',nombre:name,archivo_nombre:file.name,path:j.path});if(oldId)await api({action:'delete',nombre:name,id:oldId});await refresh()}
     catch(e){alert('No se pudo guardar: '+e.message);status.textContent=e.message}
    };input.click();
   }
   rows.querySelectorAll('[data-add-link]').forEach(b=>b.onclick=async()=>{const nombre=names[Number(b.dataset.addLink)];const titulo=(prompt('Nombre del enlace (ejemplo: Lista de precios):')||'').trim();if(!titulo)return;const url=(prompt('Pega el enlace HTTPS de Google Sheets u otra página:')||'').trim();if(!url)return;try{await api({action:'add_link',nombre,titulo,url});await refresh()}catch(e){alert('No se pudo guardar el enlace: '+e.message)}});
   rows.querySelectorAll('[data-link-open]').forEach(b=>b.onclick=()=>{const doc=enlaces.find(x=>x.id===b.dataset.linkOpen);if(doc){const u=new URL(doc.url);if(u.protocol==='https:')window.open(u.href,'_blank','noopener,noreferrer')}});
   rows.querySelectorAll('[data-link-delete]').forEach(b=>b.onclick=async()=>{const doc=enlaces.find(x=>x.id===b.dataset.linkDelete);if(!doc||!confirm('¿Eliminar el enlace '+doc.titulo+'?'))return;try{await api({action:'delete_link',nombre:doc.nombre,id:doc.id});await refresh()}catch(e){alert(e.message)}});
   rows.querySelectorAll('[data-upload]').forEach(b=>b.onclick=()=>uploadFile(names[Number(b.dataset.upload)]));
   rows.querySelectorAll('[data-open]').forEach(b=>b.onclick=async()=>{const doc=catalogos.find(x=>x.id===b.dataset.open);if(!doc)return;const tab=window.open('about:blank','_blank');try{const j=await api({action:'open',nombre:doc.nombre,id:doc.id});if(tab)tab.location.href=j.url;else window.location.href=j.url}catch(e){tab?.close();alert(e.message)}});
   rows.querySelectorAll('[data-replace]').forEach(b=>b.onclick=()=>{const doc=catalogos.find(x=>x.id===b.dataset.replace);if(doc)uploadFile(doc.nombre,doc.id)});
   rows.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{const doc=catalogos.find(x=>x.id===b.dataset.delete);if(!doc||!confirm('¿Eliminar '+doc.archivo_nombre+'?'))return;try{await api({action:'delete',nombre:doc.nombre,id:doc.id});await refresh()}catch(e){alert('No se pudo eliminar: '+e.message)}});
  }

  await refresh();
 };
 // Añade un acceso al módulo administrativo existente, sin tocar los botones de despacho.
 const attach=()=>{const row=document.querySelector('.liftAdminToolsRow');if(row&&!row.querySelector('#liftPdfShortcut')){const b=document.createElement('button');b.id='liftPdfShortcut';b.type='button';b.textContent='📄 PDF proveedores';b.onclick=window.liftPdfProvidersOpen;const abandoned=row.querySelector('#liftAbandonOpenBtn');if(abandoned)abandoned.after(b);else row.appendChild(b)}};
 new MutationObserver(attach).observe(document.body,{childList:true,subtree:true});attach();
})();

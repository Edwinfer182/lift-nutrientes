/* SUPGO · Cartera de proveedores (SUPGO CONTROL). Usa la función lift-proveedores con la clave de admin.
   Saldo positivo = le debes al proveedor; negativo = tienes saldo a favor. */
(function(){
'use strict';
const SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>(n<0?'-':'')+'$'+Math.abs(Math.round(Number(n)||0)).toLocaleString('es-CO');
const num=v=>{const n=Number(String(v==null?'':v).replace(/[^\d]/g,''));return Number.isFinite(n)?n:0};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const pw=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
const todayIn=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Bogota'});
const fdate=iso=>new Date(iso).toLocaleDateString('es-CO',{day:'numeric',month:'short',timeZone:'America/Bogota'});
const monthKey=iso=>new Date(iso).toLocaleDateString('en-CA',{timeZone:'America/Bogota'}).slice(0,7);
const monthName=k=>{const d=new Date(k+'-15T12:00:00');const s=d.toLocaleDateString('es-CO',{month:'long',year:'numeric'});return s.charAt(0).toUpperCase()+s.slice(1)};
const ago=iso=>{if(!iso)return 'Sin movimientos';const d=Math.floor((Date.now()-new Date(iso))/864e5);return d<=0?'Hoy':d===1?'Ayer':d<30?'Hace '+d+' días':'Hace '+Math.floor(d/30)+' mes'+(d>=60?'es':'')};
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
const TIPOS={
  compra_credito:{ic:'🛒',label:'Compra a crédito',bg:'#fff1e6'},
  pago_proveedor:{ic:'💸',label:'Pago al proveedor',bg:'#e8f7ee'},
  efectivo_cobrado:{ic:'💵',label:'Proveedor cobró efectivo',bg:'#eef3ff'},
  ajuste_favor:{ic:'➖',label:'Ajuste a tu favor',bg:'#e8f7ee'},
  ajuste_deuda:{ic:'➕',label:'Ajuste de deuda',bg:'#fff1e6'}
};
const signed=m=>m.tipo==='compra_credito'||m.tipo==='ajuste_deuda'?Number(m.valor)||0:m.tipo==='pago_proveedor'||m.tipo==='ajuste_favor'?-(Number(m.valor)||0):m.tipo==='efectivo_cobrado'?(Number(m.costo_proveedor)||0)-(Number(m.valor_cobrado)||0):0;
const S={provs:[],movs:[],peds:[],open:null,section:'cuentas',pdf:null,uploading:''};

/* ---------- Red ---------- */
async function call(body){
  const r=await fetch(SB+'/functions/v1/lift-proveedores',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({password:pw(),...body})});
  const j=await r.json().catch(()=>({}));
  if(r.status===401){lock('La clave no es válida');throw new Error('Clave incorrecta')}
  if(!r.ok||j.error)throw new Error(j.error||'Error '+r.status);
  return j;
}
function sync(s){const el=$('sync');el.className='sync '+s;el.querySelector('span').textContent=s==='ok'?'Sincronizado':s==='busy'?'Guardando…':s==='err'?'Sin conexión':'Conectando…'}
async function load(){
  sync('load');
  try{const j=await call({action:'providers',con_pedidos:true});S.provs=j.proveedores||[];S.movs=j.movimientos||[];S.peds=j.pedidos||[];sync('ok');render();if(S.open)fillSheet()}
  catch(e){sync('err');if(!/Clave/.test(e.message))$('provList').innerHTML='<div class="empty"><b>No pude cargar</b>'+esc(e.message)+'<br><br><button class="btn" onclick="location.reload()">Reintentar</button></div>'}
}

/* ---------- Cuentas ---------- */
const lastMov=id=>S.movs.find(m=>m.proveedor_id===id);
const prov=id=>S.provs.find(p=>p.id===id);
function render(){
  const h=location.hash.slice(1),s=['movimientos','catalogos'].includes(h)?h:'cuentas';S.section=s;
  ['cuentas','movimientos','catalogos'].forEach(x=>$('s-'+x).hidden=x!==s);
  [...$('tabs').children].forEach(a=>a.classList.toggle('on',a.dataset.s===s));
  if(s==='cuentas')renderCuentas();else if(s==='movimientos')renderMovs();else renderCatalogs();
}
function renderCuentas(){
  const debt=S.provs.filter(p=>p.balance>0).reduce((a,p)=>a+p.balance,0),fav=S.provs.filter(p=>p.balance<0).reduce((a,p)=>a-p.balance,0);
  const mk=todayIn().slice(0,7),mm=S.movs.filter(m=>monthKey(m.fecha)===mk);
  const compras=mm.filter(m=>m.tipo==='compra_credito').reduce((a,m)=>a+Number(m.valor),0),pagos=mm.filter(m=>m.tipo==='pago_proveedor').reduce((a,m)=>a+Number(m.valor),0);
  const nDebt=S.provs.filter(p=>p.balance>0).length;
  $('stats').innerHTML=`<div class="ins big${debt?'':' zero'}"><i>💼</i><b>${money(debt)}</b><span>${debt?'Debes a '+nDebt+' proveedor'+(nDebt===1?'':'es'):'Todas las cuentas al día ✓'}</span></div>`+
    `<div class="ins good"><i>➖</i><b>${money(fav)}</b><span>Saldo a tu favor</span></div>`+
    `<div class="ins"><i>🛒</i><b>${money(compras)}</b><span>Compras de ${monthName(mk).split(' ')[0].toLowerCase()}</span></div>`+
    `<div class="ins"><i>💸</i><b>${money(pagos)}</b><span>Pagado en ${monthName(mk).split(' ')[0].toLowerCase()}</span></div>`;
  const q=norm($('q').value);
  const list=S.provs.filter(p=>!q||norm([p.nombre,p.celular,p.notas].join(' ')).includes(q)||S.movs.some(m=>m.proveedor_id===p.id&&norm([m.referencia,m.cliente,m.nota].join(' ')).includes(q)));
  const withBal=list.filter(p=>p.balance!==0).sort((a,b)=>b.balance-a.balance);
  const zero=list.filter(p=>p.balance===0).sort((a,b)=>(new Date((lastMov(b.id)||{}).fecha||0))-(new Date((lastMov(a.id)||{}).fecha||0)));
  const row=p=>{const lm=lastMov(p.id),cls=p.balance>0?'debt':p.balance<0?'favor':'';
    return `<button class="pv ${cls}" data-id="${p.id}"><div class="av">${esc(p.nombre.charAt(0).toUpperCase())}</div><div style="min-width:0"><b>${esc(p.nombre)}</b><small>${ago(lm&&lm.fecha)}${lm?' · '+esc(TIPOS[lm.tipo]?TIPOS[lm.tipo].label.toLowerCase():lm.tipo):''}</small></div>
    <div class="amt">${p.balance?`<strong>${money(Math.abs(p.balance))}</strong>`:''}<span class="${cls||'zero'}">${p.balance>0?'Le debes':p.balance<0?'A tu favor':'Al día'}</span></div><span class="go">›</span></button>`};
  $('provList').innerHTML=(withBal.length?'<p class="grpT">Con saldo</p>'+withBal.map(row).join(''):'')+(zero.length?'<p class="grpT">Al día</p>'+zero.map(row).join(''):'')+(!list.length?'<div class="empty"><b>Sin resultados</b></div>':'');
}

/* ---------- Ficha ---------- */
function openSheet(id){S.open=id;$('sheet').hidden=false;document.body.style.overflow='hidden';ptab('hist');fillSheet()}
function closeSheet(){S.open=null;$('sheet').hidden=true;document.body.style.overflow=''}
function ptab(t){[...$('pTabs').children].forEach(b=>b.classList.toggle('on',b.dataset.t===t));document.querySelectorAll('#sheet .pane').forEach(p=>p.classList.toggle('on',p.dataset.p===t))}
function waLink(p,text){const c=String(p.celular||'').replace(/\D/g,'');return c?'https://wa.me/'+(c.length===10?'57'+c:c)+(text?'?text='+encodeURIComponent(text):''):''}
function fillSheet(){
  const p=prov(S.open);if(!p){closeSheet();return}
  const ms=S.movs.filter(m=>m.proveedor_id===p.id),cls=p.balance>0?'debt':p.balance<0?'favor':'zero';
  $('pName').textContent=p.nombre;$('pSub').textContent=(p.celular?'+'+p.celular+' · ':'')+ms.length+' movimiento'+(ms.length===1?'':'s');
  const wa=waLink(p);$('pWa').hidden=!wa;$('pWa').href=wa||'#';
  $('pBal').className='balCard '+cls;
  $('pBal').innerHTML=`<span>${p.balance>0?'Le debes':p.balance<0?'Tienes a tu favor':'Cuenta al día'}</span><b>${money(Math.abs(p.balance))}</b><small>${ms.length?'Último movimiento: '+fdate(ms[0].fecha)+' · '+ago(ms[0].fecha).toLowerCase():'Sin movimientos todavía'}</small>`;
  $('qSaldar').disabled=p.balance<=0;$('qSaldar').innerHTML='<i>✅</i>'+(p.balance>0?'Saldar '+money(p.balance):'Saldar cuenta');
  // Historial con saldo después de cada movimiento
  let run=p.balance,html='',mk='';
  ms.forEach(m=>{
    const k=monthKey(m.fecha);if(k!==mk){mk=k;html+=`<p class="mh">${monthName(k)}</p>`}
    const v=signed(m),t=TIPOS[m.tipo]||{ic:'•',label:m.tipo,bg:'#f1f4f0'},after=run;run-=v;
    const recent=Date.now()-new Date(m.fecha)<7*864e5;
    const det=m.tipo==='efectivo_cobrado'?`Costo ${money(m.costo_proveedor)} · cobró ${money(m.valor_cobrado)}`:'';
    html+=`<div class="mv"><div class="ic" style="background:${t.bg}">${t.ic}</div><div style="min-width:0"><b>${esc(t.label)}</b><p>${fdate(m.fecha)}${m.referencia?' · '+esc(m.referencia):''}${m.cliente?' · '+esc(m.cliente):''}${det?'\n'+det:''}${m.nota?'\n'+esc(m.nota):''}</p>${recent?`<button class="undo" data-undo="${m.id}">Anular</button>`:''}</div>
      <div class="r"><strong class="${v>0?'plus':'minus'}">${v>0?'+':v<0?'−':''}${money(Math.abs(v))}</strong><small>Saldo ${money(after)}</small></div></div>`;
  });
  $('pHist').innerHTML=html||'<div class="empty"><b>Sin movimientos</b>Registra una compra o un pago con los botones de arriba.</div>';
  const pn=norm(p.nombre),peds=S.peds.filter(x=>norm(x.proveedor_disponibilidad_nombre)===pn);
  $('pPed').innerHTML=peds.length?peds.map(x=>`<div class="pd"><div><b>Pedido #${x.id}</b><br><small>${fdate(x.created_at)} · ${esc(String(x.estado_operativo||'').replace(/_/g,' '))}</small></div><b>${money(x.total)}</b></div>`).join(''):'<div class="empty">No hay pedidos asignados a este proveedor.</div>';
  renderProvCatalogs(p);
  $('d_nombre').value=p.nombre;$('d_cel').value=p.celular||'';$('d_notas').value=p.notas||'';
  $('d_arch').disabled=p.balance!==0;$('d_arch').title=p.balance!==0?'Primero deja la cuenta en cero':'';
}

/* ---------- Catálogos PDF (función lift-catalogos-pdf) ---------- */
async function pdfCall(body){
  const r=await fetch(SB+'/functions/v1/lift-catalogos-pdf',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({password:pw(),...body})});
  const j=await r.json().catch(()=>({}));if(!r.ok||j.error)throw new Error(j.error||'Error '+r.status);return j;
}
async function loadPdf(force){
  if(S.pdf&&!force)return S.pdf;
  try{S.pdf=await pdfCall({action:'list'})}catch(e){S.pdf={catalogos:[],enlaces:[],error:e.message}}
  return S.pdf;
}
function provDocs(nombre){const d=S.pdf||{catalogos:[],enlaces:[]};return {files:d.catalogos.filter(x=>x.nombre===nombre).sort((a,b)=>String(b.actualizado_en).localeCompare(String(a.actualizado_en))),links:d.enlaces.filter(x=>x.nombre===nombre)}}
function docsHTML(nombre){
  const {files,links}=provDocs(nombre);
  const f=files.map(x=>{const old=Date.now()-new Date(x.actualizado_en)>60*864e5;return `<div class="file${old?' old':''}"><span class="fi">PDF</span><div class="fx"><b>${esc(x.archivo_nombre||'Catálogo.pdf')}</b><small>${old?'⚠️ ':''}Subido ${fdate(x.actualizado_en)} · ${ago(x.actualizado_en).toLowerCase()}</small></div><button data-open="${x.id}" data-n="${esc(nombre)}" title="Abrir">↗</button><button data-delpdf="${x.id}" data-n="${esc(nombre)}" title="Eliminar">🗑</button></div>`}).join('');
  const l=links.map(x=>`<div class="file link"><span class="fi">🔗</span><div class="fx"><b>${esc(x.titulo)}</b><small>${esc(x.url.replace(/^https:\/\//,'').slice(0,40))}</small></div><a class="btn" style="width:34px;height:34px;padding:0" href="${esc(x.url)}" target="_blank" rel="noopener">↗</a><button data-dellink="${x.id}" data-n="${esc(nombre)}" title="Quitar">🗑</button></div>`).join('');
  return `<div class="files">${f+l||'<p class="upl">Sin catálogos todavía.</p>'}${S.uploading===nombre?'<p class="upl">Subiendo PDF…</p>':''}</div><div class="acts"><button class="btn" data-up="${esc(nombre)}">⬆ Subir PDF</button><button class="btn" data-addlink="${esc(nombre)}">🔗 Agregar enlace</button></div>`;
}
async function renderCatalogs(){
  if(!S.pdf){$('catList').innerHTML='<div class="skel"></div><div class="skel"></div>';await loadPdf()}
  if(S.pdf.error){$('catList').innerHTML='<div class="empty"><b>No pude cargar los catálogos</b>'+esc(S.pdf.error)+'</div>';return}
  const q=norm($('q').value);
  const names=S.provs.map(p=>p.nombre).filter(n=>!q||norm(n).includes(q)||provDocs(n).files.some(f=>norm(f.archivo_nombre).includes(q)));
  names.sort((a,b)=>{const A=provDocs(a),B=provDocs(b);return (B.files.length+B.links.length>0)-(A.files.length+A.links.length>0)||a.localeCompare(b,'es')});
  $('catList').innerHTML=names.map(n=>`<div class="card pc"><h4>${esc(n)}</h4>${docsHTML(n)}</div>`).join('')||'<div class="empty"><b>Sin resultados</b></div>';
}
async function renderProvCatalogs(p){if(!S.pdf){$('pCat').innerHTML='<div class="skel"></div>';await loadPdf()}if(S.open===p.id)$('pCat').innerHTML=docsHTML(p.nombre)}
function refreshDocs(){if(S.section==='catalogos')renderCatalogs();const p=prov(S.open);if(p)renderProvCatalogs(p)}
let upFor='';
async function uploadPdf(nombre,file){
  if(!file)return;if(file.size>25*1024*1024){toast('El PDF debe pesar menos de 25 MB','err');return}
  S.uploading=nombre;refreshDocs();sync('busy');
  try{
    const u=await pdfCall({action:'upload',nombre,archivo_nombre:file.name.toLowerCase().endsWith('.pdf')?file.name:file.name+'.pdf'});
    const put=await fetch(u.upload_url,{method:'PUT',headers:{'Content-Type':'application/pdf','x-upsert':'false'},body:file});
    if(!put.ok)throw new Error('No se pudo subir el archivo');
    await pdfCall({action:'save',nombre,path:u.path,archivo_nombre:file.name});
    toast('Catálogo subido ✓');S.uploading='';await loadPdf(true);sync('ok');
  }catch(e){S.uploading='';sync('err');toast(e.message,'err')}
  refreshDocs();
}
async function docsClick(e){
  const b=e.target.closest('button[data-open],button[data-delpdf],button[data-dellink],button[data-up],button[data-addlink]');if(!b)return;
  const n=b.dataset.n||b.dataset.up||b.dataset.addlink;
  if(b.dataset.open){const w=window.open('','_blank');try{const j=await pdfCall({action:'open',nombre:n,id:b.dataset.open});if(w)w.location=j.url;else location.href=j.url}catch(x){if(w)w.close();toast(x.message,'err')}return}
  if(b.dataset.up){upFor=b.dataset.up;$('pdfFile').value='';$('pdfFile').click();return}
  if(b.dataset.addlink){const r=await formDlg('Enlace · '+n,'<label class="f"><span>Título</span><input id="l_t" placeholder="Ej: Lista de precios noviembre"></label><label class="f"><span>Enlace (https://…)</span><input id="l_u" type="url" placeholder="https://drive.google.com/…"></label>','Guardar',()=>{const t=$('l_t').value.trim(),u=$('l_u').value.trim();return t&&/^https:\/\//.test(u)?{titulo:t,url:u}:null});
    if(r){try{await pdfCall({action:'add_link',nombre:n,...r});toast('Enlace guardado ✓');await loadPdf(true);refreshDocs()}catch(x){toast(x.message,'err')}}return}
  if(b.dataset.delpdf||b.dataset.dellink){if(!(await confirmDlg('¿Eliminar?',b.dataset.delpdf?'El PDF se borra definitivamente.':'Se quita el enlace.','Eliminar')))return;
    try{await pdfCall({action:b.dataset.delpdf?'delete':'delete_link',nombre:n,id:b.dataset.delpdf||b.dataset.dellink});toast('Eliminado ✓');await loadPdf(true);refreshDocs()}catch(x){toast(x.message,'err')}}
}

/* ---------- Movimientos ---------- */
async function movement(kind){
  const p=prov(S.open);if(!p)return;
  if(kind==='estado'){sendStatement(p);return}
  if(kind==='saldar'){
    if(!(await confirmDlg('¿Saldar la cuenta de '+p.nombre+'?','Se registra un pago por '+money(p.balance)+' y la cuenta queda en $0.','Saldar')))return;
    await run(()=>call({action:'provider-payoff',proveedor_id:p.id}),'Cuenta saldada ✓');return;
  }
  let tipo=kind==='ajuste'?'ajuste_favor':kind;
  const tipos=kind==='ajuste'?['ajuste_favor','ajuste_deuda']:[kind];
  const html=`${tipos.length>1?`<div class="tipoSeg" id="mTipoSeg">${tipos.map(t=>`<button type="button" data-t="${t}" class="${t===tipo?'on':''}">${TIPOS[t].ic} ${TIPOS[t].label}</button>`).join('')}</div>`:''}
    <div id="mFields"></div>
    <label class="f"><span>Fecha</span><input id="m_fecha" type="date" value="${todayIn()}" max="${todayIn()}"></label>
    <label class="f"><span>Referencia (cliente o producto)</span><input id="m_ref" placeholder="Ej: Luisa · ISO 100 5 lb"></label>
    <label class="f"><span>Nota (opcional)</span><textarea id="m_nota" rows="2"></textarea></label>
    <div class="prev" id="m_prev"></div>`;
  const fields=()=>{
    $('mFields').innerHTML=tipo==='efectivo_cobrado'
      ?`<div class="two"><label class="f"><span>Costo del proveedor</span><div class="money"><i>$</i><input id="m_costo" inputmode="numeric"></div></label><label class="f"><span>Efectivo que cobró</span><div class="money"><i>$</i><input id="m_cobro" inputmode="numeric"></div></label></div>`
      :`<label class="f"><span>Valor</span><div class="money"><i>$</i><input id="m_valor" inputmode="numeric" placeholder="0"></div></label>`;
  };
  const delta=()=>tipo==='efectivo_cobrado'?num(($('m_costo')||{}).value)-num(($('m_cobro')||{}).value):(tipo==='compra_credito'||tipo==='ajuste_deuda'?1:-1)*num(($('m_valor')||{}).value);
  const preview=()=>{const d=delta(),a=p.balance+d;$('m_prev').innerHTML=d?`Saldo: <b>${money(p.balance)}</b> → <b>${money(a)}</b> <span style="color:#6b736c">(${a>0?'le debes':a<0?'a tu favor':'al día'})</span>`:'Escribe el valor para ver cómo queda la cuenta.'};
  const r=await formDlg(TIPOS[tipo].ic+' '+TIPOS[tipo].label+' · '+p.nombre,html,'Registrar',()=>{
    const d=delta();if(!d&&tipo!=='efectivo_cobrado')return null;
    if(tipo==='efectivo_cobrado'&&!num(($('m_cobro')||{}).value))return null;
    return {tipo,valor:num(($('m_valor')||{}).value),costo_proveedor:num(($('m_costo')||{}).value),valor_cobrado:num(($('m_cobro')||{}).value),fecha:$('m_fecha').value,referencia:$('m_ref').value.trim(),nota:$('m_nota').value.trim()};
  },()=>{
    fields();preview();
    $('dlgB').addEventListener('input',e=>{if(e.target.closest('.money'))e.target.value=num(e.target.value)?num(e.target.value).toLocaleString('es-CO'):'';preview()});
    const seg=$('mTipoSeg');if(seg)seg.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;tipo=b.dataset.t;[...seg.children].forEach(x=>x.classList.toggle('on',x===b));$('dlgT').textContent=TIPOS[tipo].ic+' '+TIPOS[tipo].label+' · '+p.nombre;preview()};
    const f=$('m_valor')||$('m_costo');if(f)setTimeout(()=>f.focus(),60);
  });
  if(!r)return;
  await run(()=>call({action:'provider-movement',proveedor_id:p.id,...r}),TIPOS[r.tipo].label+' registrado ✓');
}
async function run(task,okMsg){
  sync('busy');
  try{const j=await task();toast(okMsg+(j&&j.balance!=null?' · saldo '+money(j.balance):''));await load()}
  catch(e){sync('err');toast(e.message,'err')}
}
function statementText(p){
  const ms=S.movs.filter(m=>m.proveedor_id===p.id).slice(0,8);
  const lines=ms.map(m=>{const v=signed(m);return '• '+fdate(m.fecha)+' — '+(TIPOS[m.tipo]||{label:m.tipo}).label+(m.referencia?' ('+m.referencia+')':'')+': '+(v>0?'+':'−')+money(Math.abs(v))});
  return `Hola ${p.nombre}, te comparto el estado de cuenta con SUPGO:\n\n${lines.join('\n')}\n\n${p.balance>0?'*Saldo pendiente: '+money(p.balance)+'*':p.balance<0?'*Saldo a favor de SUPGO: '+money(-p.balance)+'*':'*Cuenta al día: $0* ✅'}\n\n¿Me confirmas si coincide con tus registros? Gracias 🙌`;
}
async function sendStatement(p){
  const txt=statementText(p),wa=waLink(p,txt);
  const r=await formDlg('Estado de cuenta · '+p.nombre,`<div class="waPrev">${esc(txt)}</div>${wa?'':'<p class="hint" style="margin-top:10px">Este proveedor no tiene celular. Agrégalo en la pestaña Datos.</p>'}`,wa?'Enviar por WhatsApp':'Copiar texto',()=>true);
  if(!r)return;
  if(wa)window.open(wa,'_blank','noopener');else{try{await navigator.clipboard.writeText(txt);toast('Texto copiado')}catch(e){toast('No pude copiar','err')}}
}
function renderMovs(){
  const sp=$('mProv'),st=$('mTipo'),sm=$('mMes');
  if(sp.options.length<=1){S.provs.forEach(p=>sp.add(new Option(p.nombre,p.id)));Object.entries(TIPOS).forEach(([k,t])=>st.add(new Option(t.label,k)));[...new Set(S.movs.map(m=>monthKey(m.fecha)))].forEach(k=>sm.add(new Option(monthName(k),k)))}
  const q=norm($('q').value);
  const list=S.movs.filter(m=>(!sp.value||m.proveedor_id===Number(sp.value))&&(!st.value||m.tipo===st.value)&&(!sm.value||monthKey(m.fecha)===sm.value)&&(!q||norm([(prov(m.proveedor_id)||{}).nombre,m.referencia,m.cliente,m.nota].join(' ')).includes(q)));
  const sum=t=>list.filter(m=>m.tipo===t).reduce((a,m)=>a+Number(m.valor),0);
  $('mStats').innerHTML=`<div class="ins"><i>🧾</i><b>${list.length}</b><span>Movimientos</span></div><div class="ins warn"><i>🛒</i><b>${money(sum('compra_credito'))}</b><span>Compras</span></div><div class="ins good"><i>💸</i><b>${money(sum('pago_proveedor'))}</b><span>Pagos</span></div><div class="ins"><i>±</i><b>${money(sum('ajuste_favor')+sum('ajuste_deuda'))}</b><span>Ajustes</span></div>`;
  S.mList=list;
  let mk='',html='';
  list.forEach(m=>{const k=monthKey(m.fecha);if(k!==mk){mk=k;html+=`<p class="mh">${monthName(k)}</p>`}const v=signed(m),t=TIPOS[m.tipo]||{ic:'•',label:m.tipo,bg:'#f1f4f0'},p=prov(m.proveedor_id);
    html+=`<div class="mv card" style="padding:10px 12px;margin-bottom:6px;border-radius:14px;box-shadow:none"><div class="ic" style="background:${t.bg}">${t.ic}</div><div style="min-width:0"><b><span class="who">${esc(p?p.nombre:'#'+m.proveedor_id)}</span>${esc(t.label)}</b><p>${fdate(m.fecha)}${m.referencia?' · '+esc(m.referencia):''}${m.nota?'\n'+esc(m.nota):''}</p></div><div class="r"><strong class="${v>0?'plus':'minus'}">${v>0?'+':'−'}${money(Math.abs(v))}</strong></div></div>`});
  $('movList').innerHTML=html||'<div class="empty"><b>Sin movimientos</b>con estos filtros.</div>';
}
function exportCSV(){
  const q=v=>{v=String(v==null?'':v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const rows=[['fecha','proveedor','tipo','valor','efecto_en_saldo','referencia','nota']].concat((S.mList||[]).map(m=>[new Date(m.fecha).toLocaleDateString('en-CA',{timeZone:'America/Bogota'}),(prov(m.proveedor_id)||{}).nombre,(TIPOS[m.tipo]||{}).label||m.tipo,m.tipo==='efectivo_cobrado'?m.valor_cobrado:m.valor,signed(m),m.referencia,m.nota]));
  const blob=new Blob(['﻿'+rows.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='movimientos-proveedores-'+todayIn()+'.csv';a.click();
}

/* ---------- Diálogos ---------- */
let dlgResolve=null;
function formDlg(title,html,ok,read,after){return new Promise(res=>{$('dlgT').textContent=title;$('dlgB').innerHTML=html;$('dlgOk').textContent=ok;$('dlg').hidden=false;
  dlgResolve=v=>{dlgResolve=null;$('dlg').hidden=true;res(v)};
  $('dlgOk').onclick=()=>{const v=read();if(v==null){toast('Revisa el valor','err');return}dlgResolve(v)};$('dlgNo').onclick=()=>dlgResolve(null);
  $('dlgB').onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();$('dlgOk').click()}};if(after)after()})}
function confirmDlg(t,text,ok){return formDlg(t,'<p>'+esc(text)+'</p>',ok,()=>true)}
function toast(msg,kind){const t=document.createElement('div');t.className='toast'+(kind==='err'?' err':'');t.innerHTML='<span>'+esc(msg)+'</span>';$('toasts').appendChild(t);setTimeout(()=>t.remove(),3500)}
function lock(msg){$('lock').hidden=false;$('lockErr').textContent=msg||'';setTimeout(()=>$('lockPw').focus(),50)}

/* ---------- Eventos ---------- */
async function newProvider(){
  const r=await formDlg('Nuevo proveedor','<label class="f"><span>Nombre</span><input id="n_nombre" maxlength="80"></label><label class="f"><span>Celular (WhatsApp)</span><input id="n_cel" inputmode="tel" placeholder="300 123 4567"></label>','Crear',()=>{const n=$('n_nombre').value.trim();return n?{nombre:n,celular:$('n_cel').value}:null},()=>setTimeout(()=>$('n_nombre').focus(),60));
  if(!r)return;sync('busy');
  try{const j=await call({action:'provider-create',...r});toast(j.reactivado?'Proveedor reactivado ✓':'Proveedor creado ✓');await load();openSheet(j.id)}catch(e){sync('err');toast(e.message,'err')}
}
try{if(window.top!==window)document.documentElement.classList.add('embedded')}catch(e){document.documentElement.classList.add('embedded')}
window.addEventListener('hashchange',render);
$('q').oninput=debounce(render,150);
['mProv','mTipo','mMes'].forEach(id=>$(id).onchange=renderMovs);$('mExport').onclick=exportCSV;
$('provList').onclick=e=>{const b=e.target.closest('[data-id]');if(b)openSheet(Number(b.dataset.id))};
$('sheet').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeSheet()});
$('pTabs').onclick=e=>{const b=e.target.closest('button');if(b)ptab(b.dataset.t)};
$('quick').onclick=e=>{const b=e.target.closest('[data-t]');if(b&&!b.disabled)movement(b.dataset.t)};
$('pHist').onclick=async e=>{const b=e.target.closest('[data-undo]');if(!b)return;if(!(await confirmDlg('¿Anular este movimiento?','Se borra y el saldo se recalcula. Úsalo solo para corregir errores.','Anular')))return;await run(()=>call({action:'movement-delete',id:Number(b.dataset.undo)}),'Movimiento anulado')};
$('d_save').onclick=()=>run(()=>call({action:'provider-update',id:S.open,nombre:$('d_nombre').value,celular:$('d_cel').value,notas:$('d_notas').value}),'Datos guardados ✓');
$('d_arch').onclick=async()=>{const p=prov(S.open);if(!(await confirmDlg('¿Archivar a '+p.nombre+'?','Deja de aparecer en la lista. Si lo vuelves a crear con el mismo nombre, se reactiva con su historial.','Archivar')))return;const id=S.open;closeSheet();await run(()=>call({action:'provider-update',id,archivar:true}),'Proveedor archivado')};
$('catList').onclick=docsClick;$('pCat').onclick=docsClick;
$('pdfFile').onchange=e=>uploadPdf(upFor,e.target.files[0]);
$('newProv').onclick=newProvider;$('fab').onclick=newProvider;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('dlg').hidden&&dlgResolve)dlgResolve(null);else if(S.open)closeSheet()}});
$('lockForm').onsubmit=async e=>{e.preventDefault();const v=$('lockPw').value;try{sessionStorage.setItem(PASS,v)}catch(x){}$('lockErr').textContent='Verificando…';try{await call({action:'providers'});$('lock').hidden=true;load()}catch(x){$('lockErr').textContent=/Clave/.test(x.message)?'Clave incorrecta':'Sin conexión'}};
if(!pw())lock();else load();
})();

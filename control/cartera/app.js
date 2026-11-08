/* SUPGO · Cartera de clientes (SUPGO CONTROL). RPC lift_cartera_admin con la clave de admin. */
(function(){
'use strict';
const SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CO');
const num=v=>{const n=Number(String(v==null?'':v).replace(/[^\d]/g,''));return Number.isFinite(n)?n:0};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const pw=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Bogota'});
const days=d=>d?Math.round((new Date(d+'T12:00:00')-new Date(today()+'T12:00:00'))/864e5):null;
const fdate=d=>d?new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'short',year:String(d).slice(0,4)!==today().slice(0,4)?'numeric':undefined}):'';
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
const MEDIOS=['Efectivo','Transferencia','Nequi','Bre-B','Bold','Otro'];
const S={rows:[],clients:[],filter:'saldo',open:null};

async function rpc(action,payload){
  const r=await fetch(SB+'/rest/v1/rpc/lift_cartera_admin',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify({p_password:pw(),p_action:action,p_payload:payload||{}})});
  const j=await r.json().catch(()=>null);
  if(!r.ok){const m=(j&&j.message)||'Error '+r.status;if(/Clave/.test(m))lock('La clave no es válida');throw new Error(m)}
  return j;
}
function sync(s){const el=$('sync');el.className='sync '+s;el.querySelector('span').textContent=s==='ok'?'Sincronizado':s==='busy'?'Guardando…':s==='err'?'Sin conexión':'Conectando…'}
async function load(){
  sync('load');
  try{S.rows=await rpc('list')||[];group();sync('ok');render();if(S.open)fillSheet()}
  catch(e){sync('err');if(!/Clave/.test(e.message))$('list').innerHTML='<div class="empty"><b>No pude cargar</b>'+esc(e.message)+'</div>'}
}
function group(){
  const m=new Map();
  S.rows.forEach(r=>{const k=r.cliente_id;if(!m.has(k))m.set(k,{id:k,nombre:r.nombre||'Cliente',celular:r.celular||'',debts:[]});m.get(k).debts.push(r)});
  S.clients=[...m.values()].map(c=>{
    const open=c.debts.filter(d=>d.saldo>0);
    const dues=open.map(d=>d.fecha_vencimiento).filter(Boolean).sort();
    c.saldo=open.reduce((a,d)=>a+Number(d.saldo),0);c.total=c.debts.reduce((a,d)=>a+Number(d.total),0);c.abonado=c.debts.reduce((a,d)=>a+Number(d.abonado),0);
    c.open=open.length;c.due=dues[0]||null;c.dd=days(c.due);
    c.lastPay=c.debts.flatMap(d=>d.abonos||[]).map(a=>a.fecha).sort().pop()||null;
    c._q=norm([c.nombre,c.celular,...c.debts.map(d=>'#'+d.pedido_id+' '+d.pedido_id)].join(' '));
    return c;
  });
}
function dueLabel(c){
  if(!c.saldo)return '<span class="due paid">✓ Pagado</span>';
  if(c.dd==null)return '<span class="due ok">Sin fecha de pago</span>';
  if(c.dd<0)return `<span class="due late">Vencida hace ${-c.dd} día${c.dd===-1?'':'s'}</span>`;
  if(c.dd===0)return '<span class="due soon">Vence hoy</span>';
  if(c.dd<=7)return `<span class="due soon">Vence en ${c.dd} día${c.dd===1?'':'s'}</span>`;
  return `<span class="due ok">Vence el ${fdate(c.due)}</span>`;
}
function render(){
  const open=S.clients.filter(c=>c.saldo>0),late=open.filter(c=>c.dd!=null&&c.dd<0),week=open.filter(c=>c.dd!=null&&c.dd>=0&&c.dd<=7);
  const sum=a=>a.reduce((x,c)=>x+c.saldo,0);
  const lateAmt=S.rows.filter(d=>d.saldo>0&&d.fecha_vencimiento&&days(d.fecha_vencimiento)<0).reduce((a,d)=>a+Number(d.saldo),0);
  const mk=today().slice(0,7),cobrado=S.rows.flatMap(d=>d.abonos||[]).filter(a=>String(a.fecha).slice(0,7)===mk).reduce((a,x)=>a+Number(x.valor),0);
  $('stats').innerHTML=`<div class="ins big${sum(open)?'':' zero'}"><i>💰</i><b>${money(sum(open))}</b><span>Por cobrar · ${open.length} cliente${open.length===1?'':'s'}</span></div>`+
    `<div class="ins bad"><i>⏰</i><b>${money(lateAmt)}</b><span>Vencido · ${late.length} cliente${late.length===1?'':'s'}</span></div>`+
    `<div class="ins warn"><i>📅</i><b>${money(sum(week))}</b><span>Vence esta semana</span></div>`+
    `<div class="ins good"><i>✅</i><b>${money(cobrado)}</b><span>Cobrado este mes</span></div>`;
  [...$('filt').children].forEach(b=>b.classList.toggle('on',b.dataset.f===S.filter));
  const q=norm($('q').value).replace(/^#/,'');
  let list=S.clients.filter(c=>!q||c._q.includes(q));
  list=list.filter(c=>S.filter==='saldo'?c.saldo>0:S.filter==='vencidas'?c.saldo>0&&c.dd!=null&&c.dd<0:S.filter==='semana'?c.saldo>0&&c.dd!=null&&c.dd>=0&&c.dd<=7:S.filter==='pagadas'?c.saldo===0:true);
  list.sort((a,b)=>(b.saldo>0)-(a.saldo>0)||(a.dd==null?9999:a.dd)-(b.dd==null?9999:b.dd)||b.saldo-a.saldo);
  $('list').innerHTML=list.map(c=>{const cls=!c.saldo?'paid':c.dd!=null&&c.dd<0?'late':'debt';
    return `<button class="pv ${cls}" data-id="${c.id}"><div class="av">${esc(c.nombre.charAt(0).toUpperCase())}</div><div style="min-width:0"><b>${esc(c.nombre)}</b><small>${c.open?c.open+' pedido'+(c.open===1?'':'s')+' con saldo':c.debts.length+' pedido'+(c.debts.length===1?'':'s')}${c.celular?' · '+esc(c.celular):''}</small><br>${dueLabel(c)}</div>
      <div class="amt">${c.saldo?`<strong>${money(c.saldo)}</strong><span class="debt">Debe</span>`:'<span class="zero">Al día</span>'}</div><span class="go">›</span></button>`}).join('')||'<div class="empty"><b>Nada por aquí</b>No hay clientes con este filtro.</div>';
}

/* ---------- Ficha del cliente ---------- */
const client=()=>S.clients.find(c=>c.id===S.open);
function openSheet(id){S.open=id;$('sheet').hidden=false;document.body.style.overflow='hidden';fillSheet()}
function closeSheet(){S.open=null;$('sheet').hidden=true;document.body.style.overflow=''}
function waNum(c){const n=String(c.celular||'').replace(/\D/g,'');return n?(n.length===10?'57'+n:n):''}
function fillSheet(){
  const c=client();if(!c){closeSheet();return}
  $('cName').textContent=c.nombre;$('cSub').textContent=(c.celular||'Sin celular')+' · '+c.debts.length+' pedido'+(c.debts.length===1?'':'s')+' a crédito';
  $('cCall').hidden=!c.celular;$('cCall').href='tel:'+String(c.celular).replace(/\D/g,'');
  const pct=c.total?Math.round(c.abonado/c.total*100):0,late=c.saldo&&c.dd!=null&&c.dd<0;
  $('cBal').className='balCard '+(c.saldo?(late?'late':''):'zero');
  $('cBal').innerHTML=`<span>${c.saldo?'Debe':'Cuenta al día'}</span><b>${money(c.saldo)}</b><small>Ha pagado ${money(c.abonado)} de ${money(c.total)}${c.lastPay?' · último abono '+fdate(c.lastPay):''}</small><div class="pbar"><i style="width:${pct}%"></i></div>`;
  [...$('quick').children].forEach(b=>b.disabled=!c.saldo&&b.dataset.a!=='cobrar');
  $('qTodo').innerHTML='<i>✅</i>'+(c.saldo?'Pagó todo ('+money(c.saldo)+')':'Pagó todo');
  $('quick').querySelector('[data-a="cobrar"]').disabled=!c.saldo||!waNum(c);
  const debts=c.debts.slice().sort((a,b)=>(b.saldo>0)-(a.saldo>0)||String(a.fecha_deuda).localeCompare(String(b.fecha_deuda)));
  $('cDebts').innerHTML='<p class="mh">Pedidos a crédito</p>'+debts.map(d=>{
    const dd=days(d.fecha_vencimiento),p=d.total?Math.round(d.abonado/d.total*100):0;
    const st=!d.saldo?'<span class="due paid">Pagado</span>':dd==null?'<span class="due ok">Sin fecha</span>':dd<0?`<span class="due late">Venció ${fdate(d.fecha_vencimiento)}</span>`:`<span class="due ${dd<=7?'soon':'ok'}">Vence ${fdate(d.fecha_vencimiento)}</span>`;
    const ab=(d.abonos||[]);
    return `<div class="debt${d.saldo?'':' paid'}" data-c="${d.id}">
      <div class="dh"><div><b>Pedido #${d.pedido_id}</b><small>${fdate(d.fecha_deuda)}${d.forma_pago?' · '+esc(d.forma_pago):''}</small>${st}</div><div class="r"><strong>${money(d.saldo)}</strong><small>de ${money(d.total)}</small></div></div>
      <div class="bar"><i style="width:${p}%"></i></div>
      <div class="row2">${d.saldo?`<button data-act="abono">💵 Abonar</button>`:''}<button data-act="venc">📅 ${d.fecha_vencimiento?'Cambiar fecha':'Poner fecha'}</button><button data-act="nota">✎ Nota</button></div>
      ${d.nota?`<div class="note">${esc(d.nota)}</div>`:''}
      ${(d.items||[]).length?`<details><summary>Productos (${d.items.length})</summary><ul class="items">${d.items.map(i=>`<li><span>${i.cantidad}× ${esc(i.nombre)}</span><b>${money(i.total_linea)}</b></li>`).join('')}</ul></details>`:''}
      ${ab.length?`<details ${d.saldo?'':''}><summary>Abonos (${ab.length})</summary><ul class="abs">${ab.map(a=>{const recent=a.created_at&&Date.now()-new Date(a.created_at)<7*864e5;return `<li><span>${fdate(a.fecha)} <em>${esc(a.medio||'')}${a.nota?' · '+esc(a.nota):''}</em></span><span><b>${money(a.valor)}</b>${recent?`<button class="undo" data-undo="${a.id}">Anular</button>`:''}</span></li>`}).join('')}</ul></details>`:''}
    </div>`}).join('');
}

/* ---------- Acciones ---------- */
async function abono(c,debt,full){
  const max=debt?Number(debt.saldo):c.saldo;
  let medio='Transferencia';
  const r=full?{valor:max,medio:'',fecha:today(),nota:'Pago total'}:await formDlg('Abono · '+c.nombre+(debt?' · pedido #'+debt.pedido_id:''),
    `<label class="f"><span>Valor</span><div class="money"><i>$</i><input id="a_val" inputmode="numeric"></div></label>
     <div class="chips" style="margin-top:-6px"><button type="button" data-v="${max}">Todo ${money(max)}</button>${max>=20000?`<button type="button" data-v="${Math.round(max/2/1000)*1000}">La mitad</button>`:''}</div>
     <div class="f"><span>Medio de pago</span><div class="medios" id="a_med">${MEDIOS.map(m=>`<button type="button" class="${m===medio?'on':''}">${m}</button>`).join('')}</div></div>
     <label class="f"><span>Fecha</span><input id="a_fecha" type="date" value="${today()}" max="${today()}"></label>
     <label class="f"><span>Nota (opcional)</span><input id="a_nota" placeholder="Ej: Comprobante #123"></label>
     ${!debt&&c.open>1?'<p class="hint">Se aplica primero al pedido más antiguo.</p>':''}<div class="prev" id="a_prev"></div>`,
    'Registrar abono',()=>{const v=num($('a_val').value);if(!v)return null;return {valor:Math.min(v,max),medio,fecha:$('a_fecha').value,nota:$('a_nota').value.trim()}},
    ()=>{const prev=()=>{const v=Math.min(num($('a_val').value),max);$('a_prev').innerHTML=v?`Saldo: <b>${money(max)}</b> → <b>${money(max-v)}</b>${num($('a_val').value)>max?' <span style="color:#b45309">(el valor supera la deuda; se registra '+money(max)+')</span>':''}`:'Escribe el valor del abono.'};
      $('dlgB').addEventListener('input',e=>{if(e.target.id==='a_val'){const v=num(e.target.value);e.target.value=v?v.toLocaleString('es-CO'):''}prev()});
      $('dlgB').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b){$('a_val').value=Number(b.dataset.v).toLocaleString('es-CO');prev()}const m=e.target.closest('#a_med button');if(m){medio=m.textContent;[...$('a_med').children].forEach(x=>x.classList.toggle('on',x===m))}});
      prev();setTimeout(()=>$('a_val').focus(),60)});
  if(!r)return;
  if(full&&!(await confirmDlg('¿'+c.nombre+' pagó todo?','Se registra un abono de '+money(max)+' y todos sus pedidos quedan pagados.','Sí, pagó todo')))return;
  await run(()=>debt?rpc('abono',{cartera_id:debt.id,...r}):rpc('abono_cliente',{cliente_id:c.id,...r}),'Abono de '+money(r.valor)+' registrado ✓');
}
function cobrarText(c){
  const open=c.debts.filter(d=>d.saldo>0).sort((a,b)=>String(a.fecha_deuda).localeCompare(String(b.fecha_deuda)));
  const late=c.dd!=null&&c.dd<0;
  const lines=open.map(d=>`• Pedido #${d.pedido_id} (${fdate(d.fecha_deuda)}): ${money(d.saldo)}${d.fecha_vencimiento?' — '+(days(d.fecha_vencimiento)<0?'venció':'vence')+' el '+fdate(d.fecha_vencimiento):''}`);
  const first=c.nombre.split(' ')[0];
  return (late?`Hola ${first} 👋, te escribimos de SUPGO para recordarte que tienes un saldo pendiente que ya venció:`:`Hola ${first} 👋, te escribimos de SUPGO con el resumen de tu saldo pendiente:`)+`\n\n${lines.join('\n')}\n\n*Total pendiente: ${money(c.saldo)}*\n\nPuedes pagar por transferencia a la llave Bre-B @edwin4518 o a la cuenta de ahorros Bancolombia 366 550 234 31 y enviarnos el comprobante por aquí. ¡Gracias! 🙌`;
}
async function cobrar(c){
  const txt=cobrarText(c),n=waNum(c);
  const r=await formDlg('Cobrar a '+c.nombre,`<div class="waPrev">${esc(txt)}</div>`,'Abrir WhatsApp',()=>true);
  if(r&&n)window.open('https://wa.me/'+n+'?text='+encodeURIComponent(txt),'_blank','noopener');
}
async function editDebt(d,kind){
  if(kind==='venc'){
    const r=await formDlg('Fecha de pago · pedido #'+d.pedido_id,`<label class="f"><span>Debe pagar a más tardar</span><input id="v_f" type="date" value="${d.fecha_vencimiento||''}"></label><div class="chips">${[7,15,30].map(n=>`<button type="button" data-n="${n}">+${n} días</button>`).join('')}<button type="button" data-n="0">Quitar fecha</button></div>`,'Guardar',()=>({fecha_vencimiento:$('v_f').value}),
      ()=>$('dlgB').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;const n=Number(b.dataset.n);if(!n){$('v_f').value='';return}const x=new Date(today()+'T12:00:00');x.setDate(x.getDate()+n);$('v_f').value=x.toLocaleDateString('en-CA')}));
    if(r)await run(()=>rpc('editar',{cartera_id:d.id,...r}),'Fecha guardada ✓');
  }else{
    const r=await formDlg('Nota · pedido #'+d.pedido_id,`<label class="f"><span>Nota interna</span><textarea id="n_t" rows="4">${esc(d.nota||'')}</textarea></label>`,'Guardar',()=>({nota:$('n_t').value}));
    if(r)await run(()=>rpc('editar',{cartera_id:d.id,...r}),'Nota guardada ✓');
  }
}
async function run(task,ok){sync('busy');try{await task();toast(ok);await load()}catch(e){sync('err');toast(e.message,'err')}}

/* ---------- Diálogos ---------- */
let dlgResolve=null;
function formDlg(title,html,ok,read,after){return new Promise(res=>{$('dlgT').textContent=title;$('dlgB').innerHTML=html;$('dlgOk').textContent=ok;$('dlg').hidden=false;
  dlgResolve=v=>{dlgResolve=null;$('dlg').hidden=true;res(v)};
  $('dlgOk').onclick=()=>{const v=read();if(v==null){toast('Revisa el valor','err');return}dlgResolve(v)};$('dlgNo').onclick=()=>dlgResolve(null);
  $('dlgB').onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();$('dlgOk').click()}};if(after)after()})}
const confirmDlg=(t,x,ok)=>formDlg(t,'<p>'+esc(x)+'</p>',ok,()=>true);
function toast(m,k){const t=document.createElement('div');t.className='toast'+(k==='err'?' err':'');t.innerHTML='<span>'+esc(m)+'</span>';$('toasts').appendChild(t);setTimeout(()=>t.remove(),3500)}
function lock(m){$('lock').hidden=false;$('lockErr').textContent=m||'';setTimeout(()=>$('lockPw').focus(),50)}

/* ---------- Eventos ---------- */
try{if(window.top!==window)document.documentElement.classList.add('embedded')}catch(e){document.documentElement.classList.add('embedded')}
$('q').oninput=debounce(render,150);
$('filt').onclick=e=>{const b=e.target.closest('[data-f]');if(b){S.filter=b.dataset.f;render()}};
$('list').onclick=e=>{const b=e.target.closest('[data-id]');if(b)openSheet(Number(b.dataset.id))};
$('sheet').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeSheet()});
$('quick').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const c=client();if(b.dataset.a==='abono')abono(c);else if(b.dataset.a==='todo')abono(c,null,true);else cobrar(c)};
$('cDebts').onclick=async e=>{
  const u=e.target.closest('[data-undo]');if(u){if(await confirmDlg('¿Anular este abono?','El saldo del pedido vuelve a subir. Úsalo solo para corregir errores.','Anular'))run(()=>rpc('anular_abono',{abono_id:Number(u.dataset.undo)}),'Abono anulado');return}
  const b=e.target.closest('[data-act]');if(!b)return;const d=S.rows.find(x=>x.id===Number(b.closest('[data-c]').dataset.c));
  if(b.dataset.act==='abono')abono(client(),d);else editDebt(d,b.dataset.act);
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('dlg').hidden&&dlgResolve)dlgResolve(null);else if(S.open)closeSheet()}});
$('lockForm').onsubmit=async e=>{e.preventDefault();try{sessionStorage.setItem(PASS,$('lockPw').value)}catch(x){}$('lockErr').textContent='Verificando…';try{await rpc('list');$('lock').hidden=true;load()}catch(x){$('lockErr').textContent=/Clave/.test(x.message)?'Clave incorrecta':'Sin conexión'}};
if(!pw())lock();else load();
})();

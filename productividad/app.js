/* SUPGO · Productividad. Guarda en Supabase por persona (función lift-productividad)
   y toma los resultados reales del negocio: pedidos, ventas, cotizaciones y seguimientos. */
(function(){
'use strict';
const SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const PASS='liftAdminCloudPasswordV1',PK='supgoProdPersona',OLD='lift-productividad-v1',OLDMIG='lift-productividad-v1-migrado';
const OLD_IDS=['programar','postventa','prospectos','seguimientos','cotizaciones','estados','historias','igseo','indexar','searchconsole','web','resultados','tiktok','crm'];
const AUTO={'' :'Manual',pedidos:'Pedidos creados',programados:'Pedidos programados',seguimientos:'Seguimientos de pedidos',cotizaciones:'Cotizaciones creadas',cotizaciones_seguidas:'Cotizaciones con seguimiento'};
const COLORS=['#84cc16','#3b82f6','#f59e0b','#ec4899','#14b8a6','#8b5cf6','#ef4444','#0ea5e9'];
const DOW=['D','L','M','M','J','V','S'];
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CO');
const short=n=>{n=Number(n)||0;return n>=1e6?'$'+(n/1e6).toFixed(n>=1e7?0:1).replace('.',',')+'M':n>=1e3?'$'+Math.round(n/1e3)+'k':'$'+n};
const initials=s=>String(s||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const todayStr=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Bogota'});
const addDays=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toLocaleDateString('en-CA')};
const dow=d=>new Date(d+'T12:00:00').getDay();
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
const pw=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};

const S={cfg:{actividades:[],personas:[]},persona:'',fecha:todayStr(),dias:{},metricas:{},equipo:[],cat:'Todas',draft:null,loaded:false};

/* ---------- Red ---------- */
async function call(body){
  const r=await fetch(SB+'/functions/v1/lift-productividad',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({password:pw(),...body})});
  const j=await r.json().catch(()=>({}));
  if(r.status===401){lock('La clave no es válida');throw new Error('Clave incorrecta')}
  if(!r.ok||j.error)throw new Error(j.error||'Error '+r.status);
  return j;
}
function sync(state){const el=$('sync');el.className='sync '+state;el.querySelector('span').textContent=state==='ok'?'Guardado en la nube':state==='busy'?'Guardando…':state==='err'?'Sin conexión':'Conectando…'}

async function load(){
  sync('load');
  try{
    const j=await call({action:'load',persona:S.persona||'',hasta:todayStr(),desde:addDays(todayStr(),-90)});
    S.cfg=j.config||S.cfg;
    if(!S.persona||!S.cfg.personas.includes(S.persona)){
      let saved='';try{saved=localStorage.getItem(PK)||''}catch(e){}
      S.persona=S.cfg.personas.includes(saved)?saved:S.cfg.personas[0]||'';
      if(S.persona&&S.persona!==(j.persona||'')){return load()}
    }
    S.dias={};(j.dias||[]).forEach(d=>{S.dias[d.fecha]={valores:d.valores||{},nota:d.nota||''}});
    S.metricas=j.metricas||{};S.equipo=j.equipo||[];S.loaded=true;
    sync('ok');await migrateOld();render();
  }catch(e){sync('err');if(!/Clave/.test(e.message))$('acts').innerHTML='<div class="empty"><b>No pude cargar</b><br>'+esc(e.message)+'<br><br><button class="btn" onclick="location.reload()">Reintentar</button></div>'}
}
// Trae el historial que estaba guardado solo en este navegador (versión anterior).
async function migrateOld(){
  let raw;try{if(localStorage.getItem(OLDMIG))return;raw=JSON.parse(localStorage.getItem(OLD)||'null')}catch(e){return}
  if(!raw||!raw.days){try{localStorage.setItem(OLDMIG,'1')}catch(e){}return}
  const dias=Object.entries(raw.days).map(([fecha,d])=>{const valores={};Object.entries(d.values||{}).forEach(([i,n])=>{const id=OLD_IDS[Number(i)];if(id&&Number(n)>0)valores[id]=Number(n)});return {fecha,valores,nota:''}}).filter(d=>Object.keys(d.valores).length);
  try{
    const r=await call({action:'import-days',persona:S.persona,dias});
    localStorage.setItem(OLDMIG,'1');
    if(r.n){dias.forEach(d=>{if(!S.dias[d.fecha])S.dias[d.fecha]={valores:d.valores,nota:''}});toast('Importé '+r.n+' días que tenías guardados en este dispositivo')}
  }catch(e){}
}

/* ---------- Cálculos ---------- */
const acts=()=>S.cfg.actividades||[];
const applies=(a,f)=>!a.dias||!a.dias.length||a.dias.includes(dow(f));
const day=f=>S.dias[f]||(S.dias[f]={valores:{},nota:''});
const autoVal=(a,f)=>a.auto?Number((S.metricas[f]||{})[a.auto]||0):0;
const manual=(a,f)=>Number(((S.dias[f]||{}).valores||{})[a.id]||0);
const val=(a,f)=>Math.max(manual(a,f),autoVal(a,f));
function dayScore(f,valores){
  let got=0,max=0,done=0,n=0;
  acts().forEach(a=>{if(!applies(a,f))return;n++;max+=a.xp;const v=valores?Number(valores[a.id]||0):val(a,f);const r=Math.min(1,v/a.meta);got+=r*a.xp;if(r>=1)done++});
  return {got:Math.round(got),max,pct:max?Math.round(got/max*100):0,done,n};
}
function streak(){
  let f=todayStr(),n=0;
  if(dayScore(f).pct<70)f=addDays(f,-1);
  while(dayScore(f).pct>=70&&n<365){n++;f=addDays(f,-1)}
  return n;
}
function totalXP(){let t=0;Object.keys(S.dias).forEach(f=>{t+=dayScore(f).got});return t}
const levelOf=xp=>{const l=Math.floor(Math.sqrt(xp/60))+1,cur=60*(l-1)**2,next=60*l**2;return {l,p:Math.round((xp-cur)/(next-cur)*100)}};
const catColor=c=>{const cats=[...new Set(acts().map(a=>a.categoria))];return COLORS[Math.max(0,cats.indexOf(c))%COLORS.length]};

/* ---------- Pintar ---------- */
function render(){
  renderPeople();renderDate();renderHero();renderCats();renderActs();renderKpis();renderTeam();renderWeek();renderHeat();
  const n=day(S.fecha).nota||'';if(document.activeElement!==$('note'))$('note').value=n;
}
function renderPeople(){
  $('people').innerHTML=S.cfg.personas.map(p=>`<button class="${p===S.persona?'on':''}" data-p="${esc(p)}"><i>${esc(initials(p))}</i>${esc(p)}</button>`).join('');
}
function renderDate(){
  const t=todayStr(),f=S.fecha,d=new Date(f+'T12:00:00');
  $('dateLabel').textContent=f===t?'Hoy':f===addDays(t,-1)?'Ayer':d.toLocaleDateString('es-CO',{weekday:'long'}).replace(/^./,c=>c.toUpperCase());
  $('dateSub').textContent=d.toLocaleDateString('es-CO',{day:'numeric',month:'short'});
  $('nextDay').disabled=f>=t;$('nextDay').style.opacity=f>=t?.35:1;
}
function renderHero(){
  const sc=dayScore(S.fecha),xp=totalXP(),lv=levelOf(xp),st=streak(),t=todayStr();
  $('pct').textContent=sc.pct+'%';$('ringProg').style.strokeDashoffset=326.7*(1-sc.pct/100);
  $('xp').textContent=sc.got+'/'+sc.max;$('streak').textContent=st;$('level').textContent=lv.l;$('lvlBar').style.width=lv.p+'%';
  const h=Number(new Date().toLocaleString('en-US',{hour:'numeric',hour12:false,timeZone:'America/Bogota'}));
  $('greet').textContent=S.fecha!==t?'Registro de '+$('dateLabel').textContent.toLowerCase():(h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches')+(S.persona?', '+S.persona:'');
  $('heroTitle').textContent=sc.pct>=100?'¡Día completo! 🏆':sc.pct>=70?'Vas muy bien, cierra las que faltan':sc.pct>0?sc.done+' de '+sc.n+' metas listas':'Empieza por una misión';
  const pending=acts().filter(a=>applies(a,S.fecha)&&val(a,S.fecha)<a.meta).sort((a,b)=>b.xp-a.xp||a.meta-b.meta);
  $('next').innerHTML=pending.length?`<button data-open="${esc(pending[0].id)}"><span>▶ Siguiente: ${esc(pending[0].nombre)}</span><small>+${pending[0].xp} pts</small></button>`:(sc.n?'<div class="allDone">✓ Todas las metas del día están listas</div>':'');
}
function renderCats(){
  const list=acts().filter(a=>applies(a,S.fecha)),cats=['Todas',...new Set(list.map(a=>a.categoria))];
  if(!cats.includes(S.cat))S.cat='Todas';
  $('cats').innerHTML=cats.map(c=>{const n=c==='Todas'?list.length:list.filter(a=>a.categoria===c).length,d=c==='Todas'?list.filter(a=>val(a,S.fecha)>=a.meta).length:list.filter(a=>a.categoria===c&&val(a,S.fecha)>=a.meta).length;return `<button class="${c===S.cat?'on':''}" data-c="${esc(c)}">${esc(c)}<em>${d}/${n}</em></button>`}).join('');
  $('dlCats').innerHTML=[...new Set(acts().map(a=>a.categoria))].map(c=>`<option value="${esc(c)}">`).join('');
}
function actHTML(a){
  const v=val(a,S.fecha),m=manual(a,S.fecha),au=autoVal(a,S.fecha),done=v>=a.meta,p=Math.min(100,v/a.meta*100);
  return `<article class="act${done?' done':''}" data-id="${esc(a.id)}">
    <div class="info" data-open="${esc(a.id)}"><div class="cat"><i style="background:${catColor(a.categoria)}"></i>${esc(a.categoria)}<span class="xp">+${a.xp}</span></div>
    <div class="name">${esc(a.nombre)}</div>
    <div class="meta"><b>${v}</b>/ ${a.meta}${done?' · ✓ Lista':''}${a.auto?`<span class="auto" title="${esc(AUTO[a.auto])}">⚡ ${au} auto</span>`:''}</div></div>
    <div class="ctl"><button class="stepBtn" data-d="-1" ${m<=0?'disabled':''} aria-label="Restar">−</button><button class="stepBtn plus" data-d="1" aria-label="Sumar">${done&&a.meta===1?'✓':'+1'}</button></div>
    <div class="bar"><i style="width:${p}%"></i></div></article>`;
}
function renderActs(){
  const list=acts().filter(a=>applies(a,S.fecha)&&(S.cat==='Todas'||a.categoria===S.cat));
  $('acts').innerHTML=list.map(actHTML).join('')||'<div class="empty">No hay actividades para este día. Agrégalas en ⚙.</div>';
  const sc=dayScore(S.fecha);$('doneCount').textContent=sc.done+' de '+sc.n+' listas';
}
function kpi(label,v,prev,fmt,big){
  const d=v-prev,cls=d>0?'up':d<0?'down':'eq',arrow=d>0?'▲':d<0?'▼':'=';
  return `<div class="kpi${big?' big':''}"><span>${label}</span><b>${fmt(v)}</b><small class="${cls}">${arrow} ${d===0?'igual que ayer':fmt(Math.abs(d))+' vs. ayer'}</small></div>`;
}
function renderKpis(){
  const m=S.metricas[S.fecha]||{},p=S.metricas[addDays(S.fecha,-1)]||{},n=x=>String(Math.round(x));
  const tk=m.pedidos?m.ventas/m.pedidos:0,tkp=p.pedidos?p.ventas/p.pedidos:0;
  $('kpis').innerHTML=kpi('Ventas',m.ventas||0,p.ventas||0,money,true)+kpi('Pedidos',m.pedidos||0,p.pedidos||0,n)+kpi('Ticket promedio',tk,tkp,money)+kpi('Pedidos web',m.pedidos_web||0,p.pedidos_web||0,n)+kpi('Cotizaciones',m.cotizaciones||0,p.cotizaciones||0,n)+kpi('Seguimientos',m.seguimientos||0,p.seguimientos||0,n)+kpi('Carritos abandonados',m.carritos||0,p.carritos||0,n);
}
function renderTeam(){
  const t=todayStr();
  if(S.cfg.personas.length<2||S.fecha!==t){$('teamBlock').hidden=true;return}
  $('teamBlock').hidden=false;
  const by={};S.equipo.forEach(r=>{by[r.persona]=r.valores||{}});
  if(S.persona)by[S.persona]=day(t).valores;
  const rows=S.cfg.personas.map(p=>{const v={};acts().forEach(a=>{v[a.id]=Math.max(Number((by[p]||{})[a.id]||0),autoVal(a,t))});return {p,pct:dayScore(t,v).pct}}).sort((a,b)=>b.pct-a.pct);
  $('team').innerHTML=rows.map((r,i)=>`<div class="mate"><i>${i===0&&r.pct>0?'🏆':esc(initials(r.p))}</i><b>${esc(r.p)}</b><div class="bar"><i style="width:${r.pct}%"></i></div><em>${r.pct}%</em></div>`).join('');
}
function renderWeek(){
  const t=todayStr();let html='';
  for(let i=6;i>=0;i--){const f=addDays(t,-i),sc=dayScore(f),ve=(S.metricas[f]||{}).ventas||0;
    html+=`<button class="wd${f===S.fecha?' on':''}" data-f="${f}" title="${f}: ${sc.pct}% · ${money(ve)}"><b>${sc.pct}%</b><div class="col"><i style="height:${Math.max(4,sc.pct)}%"></i></div><small>${DOW[dow(f)]} ${f.slice(8)}</small><span class="sale">${ve?short(ve):'—'}</span></button>`}
  $('week').innerHTML=html;
}
function renderHeat(){
  const t=todayStr(),start=addDays(t,-(7*11+((dow(t)+6)%7)));let html='';
  for(let i=0;i<84;i++){const f=addDays(start,i);if(f>t){html+='<i class="future"></i>';continue}const p=dayScore(f).pct,c=p>=100?'h4':p>=70?'h3':p>=40?'h2':p>0?'h1':'';html+=`<i class="${c}${f===S.fecha?' today':''}" data-f="${f}" title="${f}: ${p}%"></i>`}
  $('heat').innerHTML=html;
}

/* ---------- Guardar ---------- */
const saveDay=debounce(async f=>{
  sync('busy');const d=day(f);
  try{await call({action:'save-day',persona:S.persona,fecha:f,valores:d.valores,nota:d.nota});sync('ok');$('noteState').textContent=d.nota?'Guardada':''}
  catch(e){sync('err');toast('No se guardó: '+e.message,'err')}
},500);
function step(id,delta){
  const a=acts().find(x=>x.id===id);if(!a)return;
  const f=S.fecha,d=day(f),before=dayScore(f).pct,wasDone=val(a,f)>=a.meta;
  let m=manual(a,f);
  if(delta>0&&a.meta===1&&val(a,f)>=1)return;
  m=Math.max(0,m+delta);
  if(delta>0&&m<=autoVal(a,f))m=autoVal(a,f)+1;
  if(m)d.valores[a.id]=m;else delete d.valores[a.id];
  saveDay(f);render();
  const card=document.querySelector('.act[data-id="'+CSS.escape(id)+'"] .plus');if(card&&delta>0){card.classList.remove('pop');void card.offsetWidth;card.classList.add('pop')}
  const after=dayScore(f).pct;
  if(!wasDone&&val(a,f)>=a.meta)toast('✓ '+a.nombre+' · +'+a.xp+' pts','win');
  if(before<100&&after>=100)confetti();
  if(!$('detail').hidden)fillDetail(id);
}
function confetti(){const c=document.createElement('div');c.className='confetti';for(let i=0;i<70;i++){const x=document.createElement('i');x.style.left=Math.random()*100+'%';x.style.background=COLORS[i%COLORS.length];x.style.animationDelay=Math.random()*.5+'s';x.style.animationDuration=1+Math.random()*.9+'s';c.appendChild(x)}document.body.appendChild(c);setTimeout(()=>c.remove(),2600);toast('🏆 ¡Completaste todas las metas del día!','win')}

/* ---------- Detalle ---------- */
let detailId='';
function openDetail(id){detailId=id;fillDetail(id);$('detail').hidden=false}
function fillDetail(id){
  const a=acts().find(x=>x.id===id);if(!a)return;const v=val(a,S.fecha),au=autoVal(a,S.fecha);
  $('dCat').textContent=a.categoria+' · +'+a.xp+' puntos';$('dTitle').textContent=a.nombre;
  $('dVal').textContent=v;$('dGoal').textContent='de '+a.meta+(v>=a.meta?' · ✓ lista':'');$('dBar').style.width=Math.min(100,v/a.meta*100)+'%';
  $('dMinus').disabled=manual(a,S.fecha)<=0;
  $('dAuto').textContent=a.auto?'⚡ Se cuenta sola desde '+AUTO[a.auto].toLowerCase()+': '+au+' hoy. Suma a mano solo lo que el sistema no registra.':'';
  const prevOk=($('dSteps').dataset.id===id)?[...$('dSteps').children].map(li=>li.classList.contains('ok')):[];
  $('dSteps').dataset.id=id;
  $('dSteps').innerHTML=(a.pasos||[]).map((s,i)=>`<li class="${prevOk[i]?'ok':''}">${esc(s)}</li>`).join('')||'<li>Sin instrucciones. Agrégalas con “Editar esta actividad”.</li>';
  const l=$('dLink');l.hidden=!a.enlace;l.href=a.enlace||'#';
  if(/^\/control\//.test(a.enlace||'')){l.target='_top'}else l.target='_blank';
}

/* ---------- Ajustes ---------- */
function openSettings(focusId){
  S.draft={actividades:JSON.parse(JSON.stringify(acts())),personas:[...S.cfg.personas]};
  $('settings').hidden=false;setTab(focusId?'acts':'acts');renderSetActs(focusId);renderSetTeam();$('setDirty').textContent='';
}
function setTab(t){[...$('setTabs').children].forEach(b=>b.classList.toggle('on',b.dataset.t===t));document.querySelectorAll('#settings [data-p]').forEach(p=>p.hidden=p.dataset.p!==t)}
function renderSetActs(openId){
  const L=S.draft.actividades;
  $('setActs').innerHTML=L.map((a,i)=>`<details class="sa" data-i="${i}" ${a.id===openId?'open':''}><summary><b>${esc(a.nombre||'Nueva actividad')}</b><small>${esc(a.categoria)} · meta ${a.meta} · ${a.xp} pts</small><button class="mv" data-mv="-1" ${i===0?'disabled':''} title="Subir">↑</button><button class="mv" data-mv="1" ${i===L.length-1?'disabled':''} title="Bajar">↓</button></summary>
    <div class="fields">
      <label class="f"><span>Nombre</span><input data-k="nombre" value="${esc(a.nombre)}"></label>
      <div class="three"><label class="f"><span>Categoría</span><input data-k="categoria" list="dlCats" value="${esc(a.categoria)}"></label><label class="f"><span>Meta diaria</span><input data-k="meta" type="number" min="1" value="${a.meta}"></label><label class="f"><span>Puntos</span><input data-k="xp" type="number" min="1" value="${a.xp}"></label></div>
      <label class="f"><span>Contar automáticamente</span><select data-k="auto">${Object.entries(AUTO).map(([k,v])=>`<option value="${k}" ${a.auto===k?'selected':''}>${v}</option>`).join('')}</select></label>
      <div class="f"><span>Días (vacío = todos)</span><div class="days">${[1,2,3,4,5,6,0].map(d=>`<button type="button" data-day="${d}" class="${(a.dias||[]).includes(d)?'on':''}">${DOW[d]}</button>`).join('')}</div></div>
      <label class="f"><span>Instrucciones (una por línea)</span><textarea data-k="pasos" rows="3">${esc((a.pasos||[]).join('\n'))}</textarea></label>
      <label class="f"><span>Enlace de la herramienta</span><input data-k="enlace" value="${esc(a.enlace||'')}" placeholder="https://… o /control/#pedidos"></label>
      <button type="button" class="del" data-del="${i}">Eliminar actividad</button>
    </div></details>`).join('');
}
function renderSetTeam(){
  $('setTeam').innerHTML=S.draft.personas.map((p,i)=>`<div class="person"><i>${esc(initials(p))}</i><b>${esc(p)}</b><button class="iconBtn" data-pdel="${i}" ${S.draft.personas.length<2?'disabled':''} title="Quitar">✕</button></div>`).join('');
}
async function saveSettings(){
  const d=S.draft;if(d.actividades.some(a=>!a.nombre.trim())){toast('Cada actividad necesita nombre','err');return}
  const b=$('saveSettings');b.disabled=true;b.textContent='Guardando…';
  try{const j=await call({action:'save-config',actividades:d.actividades,personas:d.personas});S.cfg={actividades:j.actividades,personas:j.personas};
    if(!S.cfg.personas.includes(S.persona)){S.persona=S.cfg.personas[0];await load()}else render();
    $('settings').hidden=true;toast('Ajustes guardados ✓');
  }catch(e){toast('No se guardó: '+e.message,'err')}
  b.disabled=false;b.textContent='Guardar cambios';
}

/* ---------- Avisos ---------- */
function toast(msg,kind){const t=document.createElement('div');t.className='toast'+(kind?' '+kind:'');t.textContent=msg;$('toasts').appendChild(t);while($('toasts').children.length>3)$('toasts').firstChild.remove();setTimeout(()=>t.remove(),3200)}

/* ---------- Eventos ---------- */
function bind(){
  $('people').onclick=e=>{const b=e.target.closest('[data-p]');if(!b||b.dataset.p===S.persona)return;S.persona=b.dataset.p;try{localStorage.setItem(PK,S.persona)}catch(x){}S.dias={};renderPeople();load()};
  $('prevDay').onclick=()=>{S.fecha=addDays(S.fecha,-1);if(S.fecha<addDays(todayStr(),-90))S.fecha=addDays(todayStr(),-90);render()};
  $('nextDay').onclick=()=>{if(S.fecha<todayStr()){S.fecha=addDays(S.fecha,1);render()}};
  $('dateBtn').onclick=()=>{S.fecha=todayStr();render()};
  $('cats').onclick=e=>{const b=e.target.closest('[data-c]');if(b){S.cat=b.dataset.c;renderCats();renderActs()}};
  document.addEventListener('click',e=>{
    const o=e.target.closest('[data-open]');if(o&&!e.target.closest('.stepBtn')){openDetail(o.dataset.open);return}
    const s=e.target.closest('.act [data-d]');if(s){step(s.closest('.act').dataset.id,Number(s.dataset.d));return}
    const w=e.target.closest('[data-f]');if(w&&(w.closest('#week')||w.closest('#heat'))){S.fecha=w.dataset.f;render();window.scrollTo({top:0,behavior:'smooth'});return}
    if(e.target.closest('[data-close]')){e.target.closest('.sheetWrap').hidden=true}
  });
  $('dMinus').onclick=()=>step(detailId,-1);$('dPlus').onclick=()=>step(detailId,1);
  $('dSteps').onclick=e=>{const li=e.target.closest('li');if(li)li.classList.toggle('ok')};
  $('dEdit').onclick=()=>{$('detail').hidden=true;openSettings(detailId)};
  $('note').oninput=()=>{day(S.fecha).nota=$('note').value;$('noteState').textContent='Escribiendo…';saveDay(S.fecha)};
  $('settingsBtn').onclick=()=>openSettings();
  $('setTabs').onclick=e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.t)};
  $('setActs').addEventListener('input',e=>{const el=e.target.closest('[data-k]');if(!el)return;const a=S.draft.actividades[Number(el.closest('.sa').dataset.i)],k=el.dataset.k;
    a[k]=k==='meta'||k==='xp'?Math.max(1,Number(el.value)||1):k==='pasos'?el.value.split('\n').map(s=>s.trim()).filter(Boolean):el.value;
    const sm=el.closest('.sa').querySelector('summary');sm.querySelector('b').textContent=a.nombre||'Nueva actividad';sm.querySelector('small').textContent=a.categoria+' · meta '+a.meta+' · '+a.xp+' pts';$('setDirty').textContent='Cambios sin guardar'});
  $('setActs').addEventListener('change',e=>{const el=e.target.closest('select[data-k]');if(el){S.draft.actividades[Number(el.closest('.sa').dataset.i)].auto=el.value;$('setDirty').textContent='Cambios sin guardar'}});
  $('setActs').addEventListener('click',e=>{
    const mv=e.target.closest('[data-mv]');if(mv){e.preventDefault();const i=Number(mv.closest('.sa').dataset.i),j=i+Number(mv.dataset.mv),L=S.draft.actividades;[L[i],L[j]]=[L[j],L[i]];renderSetActs();$('setDirty').textContent='Cambios sin guardar';return}
    const dy=e.target.closest('[data-day]');if(dy){const a=S.draft.actividades[Number(dy.closest('.sa').dataset.i)],d=Number(dy.dataset.day);a.dias=a.dias||[];a.dias=a.dias.includes(d)?a.dias.filter(x=>x!==d):[...a.dias,d];dy.classList.toggle('on');$('setDirty').textContent='Cambios sin guardar';return}
    const del=e.target.closest('[data-del]');if(del){const i=Number(del.dataset.del);if(!confirm('¿Eliminar “'+S.draft.actividades[i].nombre+'”? El historial se conserva.'))return;S.draft.actividades.splice(i,1);renderSetActs();$('setDirty').textContent='Cambios sin guardar'}
  });
  $('addAct').onclick=()=>{const id='a'+Date.now().toString(36);S.draft.actividades.push({id,nombre:'',categoria:S.cat!=='Todas'?S.cat:'Ventas',meta:1,xp:10,auto:'',pasos:[],enlace:'',dias:[]});renderSetActs(id);const el=document.querySelector('.sa[open] [data-k="nombre"]');if(el)el.focus();$('setDirty').textContent='Cambios sin guardar'};
  $('addPerson').onclick=()=>{const n=$('newPerson').value.trim();if(!n)return;if(S.draft.personas.includes(n)){toast('Ya existe','err');return}S.draft.personas.push(n);$('newPerson').value='';renderSetTeam();$('setDirty').textContent='Cambios sin guardar'};
  $('newPerson').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('addPerson').click()}};
  $('setTeam').onclick=e=>{const b=e.target.closest('[data-pdel]');if(!b)return;S.draft.personas.splice(Number(b.dataset.pdel),1);renderSetTeam();$('setDirty').textContent='Cambios sin guardar'};
  $('saveSettings').onclick=saveSettings;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.sheetWrap').forEach(s=>s.hidden=true)});
  // Al volver a la pestaña, actualizar resultados reales.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.loaded&&pw())load()});
  setInterval(()=>{if(!document.hidden&&S.loaded&&pw())load()},5*60*1000);
}

/* ---------- Acceso ---------- */
function lock(msg){$('lock').hidden=false;$('lockErr').textContent=msg||'';setTimeout(()=>$('lockPw').focus(),50)}
$('lockForm').onsubmit=async e=>{
  e.preventDefault();const v=$('lockPw').value;if(!v)return;$('lockErr').textContent='Verificando…';
  try{sessionStorage.setItem(PASS,v)}catch(x){}
  try{await call({action:'load',persona:'',hasta:todayStr()});try{sessionStorage.setItem('liftAdminUnlockedV1','1')}catch(x){}$('lock').hidden=true;load()}
  catch(x){try{sessionStorage.removeItem(PASS)}catch(y){}$('lockErr').textContent=/Clave/.test(x.message)?'Clave incorrecta':'Sin conexión'}
};
try{if(window.top!==window)document.documentElement.classList.add('embedded')}catch(e){document.documentElement.classList.add('embedded')}
bind();
if(!pw())lock();else load();
})();

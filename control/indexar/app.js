/* SUPGO · Indexar en Google.
   Google no permite automatizar "Solicitar indexación" (su Indexing API es solo para empleos y transmisiones),
   así que esta herramienta prepara todo lo demás: lista las URLs del sitemap, las prioriza por ventas y estado,
   consulta el estado real con la API de inspección de Search Console y abre cada URL lista para pedirla. */
(function(){
'use strict';
const SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
const GCLIENT='446005762435-rkq4ech241m211r9ttsbh2df6aqs1cn6.apps.googleusercontent.com';
const SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
const TOKK='supgoGscToken',PROPK='supgoGscProp',LINKK='supgoGscLinks',SKIPK='supgoIdxSkip',DAILY=10;
const SITEMAPS=[['pagina','/sitemap-paginas.xml'],['categoria','/sitemap-categorias.xml'],['laboratorio','/sitemap-laboratorios.xml'],['pagina','/sitemap-guias.xml'],['producto','/sitemap-productos.xml']];
const ICON={producto:'📦',categoria:'🏷️',laboratorio:'🏭',pagina:'📄'};
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const pw=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
const ls=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}};
const ss=(k,v)=>{try{if(v===undefined)return JSON.parse(sessionStorage.getItem(k)||'null');sessionStorage.setItem(k,JSON.stringify(v))}catch(e){return null}};
const ago=iso=>{if(!iso)return '';const d=Math.floor((Date.now()-new Date(iso))/864e5);return d<=0?'hoy':d===1?'ayer':'hace '+d+' días'};
const pretty=s=>{s=decodeURIComponent(s).replace(/-/g,' ');return s.charAt(0).toUpperCase()+s.slice(1)};
const S={urls:[],state:new Map(),sales:{},today:0,filter:'prio',tipo:'',shown:0,list:[],names:{},token:null,prop:ls(PROPK)||'',links:ss(LINKK)||{},checking:false,skip:new Set(ls(SKIPK)||[])};

/* ---------- Datos ---------- */
async function rpc(action,payload){
  const r=await fetch(SB+'/rest/v1/rpc/lift_indexacion_admin',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify({p_password:pw(),p_action:action,p_payload:payload||{}})});
  const j=await r.json().catch(()=>null);
  if(!r.ok){const m=(j&&j.message)||'Error '+r.status;if(/Clave/.test(m))lock('La clave no es válida');throw new Error(m)}
  return j;
}
function sync(s,t){const el=$('sync');el.className='sync '+s;el.querySelector('span').textContent=t}
async function loadSitemaps(){
  const seen=new Set(),out=[];
  const res=await Promise.all(SITEMAPS.map(([tipo,path])=>fetch(path,{cache:'no-store'}).then(r=>r.ok?r.text():'').catch(()=>'').then(x=>[tipo,x])));
  res.forEach(([tipo,xml])=>{(xml.match(/<loc>[^<]+<\/loc>/g)||[]).forEach(m=>{const url=m.slice(5,-6).replace(/&amp;/g,'&');if(seen.has(url))return;seen.add(url);out.push({url,tipo:tipo==='pagina'&&/\/guias\//.test(url)?'pagina':tipo})})});
  return out;
}
async function loadNames(){}
async function load(){
  sync('load','Cargando sitemap y estado…');
  try{
    const [urls,st]=await Promise.all([loadSitemaps(),rpc('list'),loadNames()]);
    S.urls=urls;S.sales=st.ventas||{};S.today=st.hoy||0;
    S.state=new Map((st.estado||[]).map(x=>[x.url,x]));
    if(!S.urls.length)throw new Error('No pude leer el sitemap');
    S.urls.forEach(decorate);
    sync('ok',S.urls.length+' URLs en tu sitemap');render();
  }catch(e){sync('err','Error');if(!/Clave/.test(e.message))$('list').innerHTML='<div class="empty"><b>No pude cargar</b>'+esc(e.message)+'</div>'}
}
function decorate(u){
  const path=u.url.replace('https://supgo.co','');
  const slug=(path.match(/\/(?:producto|categorias|laboratorios)\/([^/]+)\/?$/)||[])[1]||'';
  u.path=path;u.slug=slug;u.ventas=u.tipo==='producto'?Number(S.sales[slug]||0):0;
  u.title=path==='/'?'Página principal':u.tipo==='producto'?(S.names[slug]||pretty(slug)):u.tipo==='categoria'?'Categoría: '+pretty(slug):u.tipo==='laboratorio'?'Laboratorio: '+pretty(slug):pretty(path.replace(/^\/|\/$|\.html$/g,'').split('/').pop()||path);
  u._q=norm(u.title+' '+path);
}
function st(u){return S.state.get(u.url)||{}}
function status(u){
  const s=st(u);
  if(s.veredicto==='PASS')return 'ok';
  const solicit=s.solicitado_en&&Date.now()-new Date(s.solicitado_en)<14*864e5;
  if(solicit)return 'sol';
  if(s.veredicto)return 'no';
  return 'new';
}
function score(u){
  const s=status(u);if(s==='ok'||s==='sol')return -1;
  let p=u.path==='/'?10000:u.tipo==='pagina'?600:u.tipo==='categoria'?500:u.tipo==='laboratorio'?300:100;
  p+=u.ventas*40;if(s==='no')p+=200;if(S.skip.has(u.url))p-=5000;
  return p;
}

/* ---------- Pintar ---------- */
function render(){
  const all=S.urls,ok=all.filter(u=>status(u)==='ok').length,no=all.filter(u=>status(u)==='no').length,sol=all.filter(u=>status(u)==='sol').length,rev=all.filter(u=>st(u).revisado_en).length;
  $('stats').innerHTML=`<div class="ins"><i>🗺️</i><b>${all.length}</b><span>URLs en el sitemap</span></div><div class="ins good"><i>✅</i><b>${ok}</b><span>Indexadas${rev?'':' (conecta Google)'}</span></div><div class="ins bad"><i>⛔</i><b>${no}</b><span>Sin indexar</span></div><div class="ins"><i>📨</i><b>${sol}</b><span>Solicitadas (14 días)</span></div>`;
  renderQuota();renderNext();renderG();
  const q=norm($('q').value);
  let L=all.filter(u=>(!S.tipo||u.tipo===S.tipo)&&(!q||u._q.includes(q)));
  const s0=S.filter;
  L=L.filter(u=>{const s=status(u);return s0==='all'?true:s0==='prio'?(s==='new'||s==='no'):s0==='no'?s==='no':s0==='sol'?s==='sol':s==='ok'});
  L.sort(s0==='prio'?(a,b)=>score(b)-score(a):(a,b)=>b.ventas-a.ventas||a.path.localeCompare(b.path));
  S.list=L;S.shown=0;$('list').innerHTML='';more();
  [...$('filt').children].forEach(b=>b.classList.toggle('on',b.dataset.f===S.filter));
  [...$('tipos').children].forEach(b=>b.classList.toggle('on',b.dataset.t===S.tipo));
}
function more(){
  const n=S.list.slice(S.shown,S.shown+80);$('list').insertAdjacentHTML('beforeend',n.map(row).join(''));S.shown+=n.length;
  $('more').textContent=S.list.length?(S.shown<S.list.length?'Mostrando '+S.shown+' de '+S.list.length:''):'';
  if(!S.list.length)$('list').innerHTML='<div class="empty"><b>Nada por aquí</b>'+(S.filter==='prio'?'¡Todo lo prioritario ya está pedido o indexado! 🎉':'Sin resultados con estos filtros.')+'</div>';
}
function tagFor(u){
  const s=st(u),x=status(u),t=[];
  if(u.ventas)t.push(`<span class="tg sold">🔥 ${u.ventas} vendidos</span>`);
  if(x==='ok')t.push(`<span class="tg ok">✓ Indexada</span>`);
  else if(s.cobertura)t.push(`<span class="tg no">${esc(s.cobertura)}</span>`);
  else if(!s.revisado_en)t.push('<span class="tg">Sin revisar</span>');
  if(s.solicitado_en)t.push(`<span class="tg sol">Pedida ${ago(s.solicitado_en)}${s.veces_solicitado>1?' · '+s.veces_solicitado+' veces':''}</span>`);
  if(s.ultimo_rastreo)t.push(`<span class="tg">Google la visitó ${ago(s.ultimo_rastreo)}</span>`);
  return t.join('');
}
function row(u){
  const x=status(u);
  return `<div class="ux${x==='ok'?' done':''}" data-u="${esc(u.url)}"><div class="ti">${ICON[u.tipo]||'📄'}</div><div style="min-width:0"><b>${esc(u.title)}</b><div class="u">${esc(u.path)}</div><div class="tags">${tagFor(u)}</div></div>
    <div class="acts">${x==='sol'?'<button data-a="undo">Deshacer</button>':''}<button data-a="copy" title="Copiar URL">⧉</button>${x!=='ok'?'<button class="go" data-a="go">🚀 Pedir</button>':'<button data-a="go">Ver</button>'}</div></div>`;
}
function next(){return S.urls.filter(u=>score(u)>-1).sort((a,b)=>score(b)-score(a))[0]}
function renderNext(){
  const n=next();
  $('nextTitle').textContent=n?n.title:'¡Todo pedido! 🎉';$('nextUrl').textContent=n?n.url:'No quedan URLs prioritarias pendientes.';
  $('goNext').disabled=!n;$('skipNext').disabled=!n;
  const viaLink=n&&S.links[n.url];
  $('howto').innerHTML=n?'Se abre Search Console con la página ya cargada (no pegues nada). Espera el resultado, toca <b>“Solicitar indexación”</b> y vuelve aquí.':'';
}
function renderQuota(){
  const n=Math.min(S.today,DAILY);$('qNum').textContent=S.today;$('qMax').textContent=DAILY;
  $('qProg').style.strokeDashoffset=263.9*(1-n/DAILY);
}
function renderG(){
  const c=$('gcard');
  if(S.checking){c.innerHTML=`<div class="gi">🔎</div><div class="gt"><b>Consultando a Google…</b><span id="gProgT">Revisando URLs</span><div class="prog"><i id="gProg"></i></div></div><button class="btn" id="gStop">Detener</button>`;return}
  if(!S.token){c.innerHTML=`<div class="gi">🔗</div><div class="gt"><b>Conecta Search Console para ver qué ya está indexado</b><span>Google responde página por página si está indexada, cuándo la visitó y por qué no la muestra. Solo lectura.</span></div><button class="btn primary" id="gConnect">Conectar con Google</button>`;return}
  const pending=S.urls.filter(u=>!st(u).revisado_en||Date.now()-new Date(st(u).revisado_en)>3*864e5).length;
  c.innerHTML=`<div class="gi">✅</div><div class="gt"><b>Conectado a Search Console</b><span>Propiedad ${esc(S.prop)} · ${pending} URL${pending===1?'':'s'} sin revisar en los últimos 3 días</span></div><button class="btn primary" id="gCheck">Revisar estado con Google</button>`;
}

/* ---------- Google ---------- */
function tokenOk(){const t=ss(TOKK);if(t&&t.exp>Date.now()+60000){S.token=t.v;return true}S.token=null;return false}
function connect(){
  if(!window.google||!google.accounts||!google.accounts.oauth2){toast('Cargando Google… intenta de nuevo en unos segundos','err');return}
  const tc=google.accounts.oauth2.initTokenClient({client_id:GCLIENT,scope:SCOPE,prompt:'',callback:async r=>{
    if(r.error){toast('Google no dio permiso: '+r.error,'err');return}
    ss(TOKK,{v:r.access_token,exp:Date.now()+(Number(r.expires_in)||3600)*1000});S.token=r.access_token;
    try{await pickProperty();renderG();renderNext();toast('Search Console conectado ✓')}catch(e){S.token=null;gError(e)}
  }});
  tc.requestAccessToken();
}
async function gapi(url,body){
  const r=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+S.token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(r.status===401){S.token=null;ss(TOKK,null);throw new Error('La sesión de Google expiró; conecta de nuevo')}
  if(!r.ok)throw Object.assign(new Error((j.error&&j.error.message)||'Error '+r.status),{status:r.status,reason:j.error&&j.error.status});
  return j;
}
async function pickProperty(){
  const j=await gapi('https://www.googleapis.com/webmasters/v3/sites');
  const sites=(j.siteEntry||[]).filter(s=>s.permissionLevel!=='siteUnverifiedUser').map(s=>s.siteUrl);
  const p=sites.find(s=>s==='sc-domain:supgo.co')||sites.find(s=>/^https:\/\/supgo\.co\/?$/.test(s))||sites.find(s=>/supgo\.co/.test(s));
  if(!p)throw new Error('Esa cuenta de Google no tiene supgo.co en Search Console. Entra con la cuenta que administra el sitio.');
  S.prop=p;ls(PROPK,p);
}
function gError(e){
  const m=String(e.message||e);
  if(/has not been used|disabled|SERVICE_DISABLED|accessNotConfigured/i.test(m)){
    formDlg('Falta activar la API de Search Console',`<p>Es un paso de una sola vez en Google Cloud (el mismo proyecto del botón “Entrar con Google”):</p><ol style="padding-left:18px;line-height:1.7"><li>Abre <a href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com" target="_blank" rel="noopener">Google Search Console API</a> con tu cuenta.</li><li>Elige el proyecto de SUPGO y toca <b>Habilitar</b>.</li><li>Vuelve aquí y toca <b>Conectar con Google</b>.</li></ol>`,'Entendido',()=>true);
  }else toast(m,'err');
}
let stop=false;
async function checkAll(){
  if(!tokenOk()){connect();return}
  const todo=S.urls.filter(u=>!st(u).revisado_en||Date.now()-new Date(st(u).revisado_en)>3*864e5).sort((a,b)=>(b.path==='/')-(a.path==='/')||b.ventas-a.ventas||(a.tipo==='producto')-(b.tipo==='producto')).slice(0,300);
  if(!todo.length){toast('Todo fue revisado en los últimos 3 días');return}
  S.checking=true;stop=false;renderG();$('gStop').onclick=()=>{stop=true};
  let done=0,buf=[],fails=0;
  const flush=async()=>{if(!buf.length)return;const items=buf;buf=[];try{await rpc('inspeccion',{items})}catch(e){}};
  for(const u of todo){
    if(stop)break;
    try{
      const j=await gapi('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',{inspectionUrl:u.url,siteUrl:S.prop,languageCode:'es'});
      const r=j.inspectionResult||{},ix=r.indexStatusResult||{};
      if(r.inspectionResultLink){S.links[u.url]=r.inspectionResultLink}
      const item={url:u.url,veredicto:ix.verdict||'',cobertura:ix.coverageState||'',ultimo_rastreo:ix.lastCrawlTime||'',canonical:ix.googleCanonical||''};
      S.state.set(u.url,{...st(u),revisado_en:new Date().toISOString(),veredicto:item.veredicto,cobertura:item.cobertura,ultimo_rastreo:item.ultimo_rastreo||null});
      buf.push(item);if(buf.length>=20)await flush();
    }catch(e){fails++;if(e.status===429||/quota/i.test(e.message)){toast('Google pidió una pausa (límite de consultas). Sigue más tarde.','err');break}if(e.status===403||e.status===401){gError(e);break}}
    done++;const p=$('gProg');if(p){p.style.width=(done/todo.length*100)+'%';$('gProgT').textContent=done+' de '+todo.length+' revisadas'+(fails?' · '+fails+' con error':'')}
  }
  await flush();ss(LINKK,S.links);S.checking=false;render();toast(done+' URLs revisadas con Google ✓');
}

/* ---------- Pedir indexación ---------- */
async function copy(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(x){}a.remove();return ok}}
async function request(u){
  const link=S.links[u.url];
  const prop=S.prop||'sc-domain:supgo.co';
  await copy(u.url);
  window.open(link||'https://search.google.com/search-console/inspect?resource_id='+encodeURIComponent(prop)+'&id='+encodeURIComponent(u.url),'_blank','noopener');
  if(status(u)==='ok')return;
  try{await rpc('solicitado',{url:u.url});const s=st(u);S.state.set(u.url,{...s,solicitado_en:new Date().toISOString(),veces_solicitado:(s.veces_solicitado||0)+1});S.today++;
    toast('Abierta en Search Console · toca “Solicitar indexación”');
    if(S.today===DAILY)toast('Llegaste a '+DAILY+' hoy. Google puede rechazar más pedidos hasta mañana.','err');
    render();
  }catch(e){toast(e.message,'err')}
}

/* ---------- Varios ---------- */
let dlgResolve=null;
function formDlg(title,html,ok,read){return new Promise(res=>{$('dlgT').textContent=title;$('dlgB').innerHTML=html;$('dlgOk').textContent=ok;$('dlg').hidden=false;dlgResolve=v=>{dlgResolve=null;$('dlg').hidden=true;res(v)};$('dlgOk').onclick=()=>dlgResolve(read());$('dlgNo').onclick=()=>dlgResolve(null)})}
function toast(m,k){const t=document.createElement('div');t.className='toast'+(k==='err'?' err':'');t.innerHTML='<span>'+esc(m)+'</span>';$('toasts').appendChild(t);while($('toasts').children.length>3)$('toasts').firstChild.remove();setTimeout(()=>t.remove(),4200)}
function lock(m){$('lock').hidden=false;$('lockErr').textContent=m||'';setTimeout(()=>$('lockPw').focus(),50)}
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};

try{if(window.top!==window)document.documentElement.classList.add('embedded')}catch(e){document.documentElement.classList.add('embedded')}
$('q').oninput=debounce(render,150);
$('filt').onclick=e=>{const b=e.target.closest('[data-f]');if(b){S.filter=b.dataset.f;render()}};
$('tipos').onclick=e=>{const b=e.target.closest('button');if(b){S.tipo=b.dataset.t;render()}};
$('goNext').onclick=()=>{const n=next();if(n)request(n)};
$('skipNext').onclick=()=>{const n=next();if(!n)return;S.skip.add(n.url);ls(SKIPK,[...S.skip]);renderNext();toast('Saltada; queda al final de la fila')};
$('gcard').onclick=e=>{if(e.target.closest('#gConnect'))connect();if(e.target.closest('#gCheck'))checkAll()};
$('list').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;const u=S.urls.find(x=>x.url===b.closest('[data-u]').dataset.u);if(!u)return;
  if(b.dataset.a==='copy'){if(await copy(u.url))toast('URL copiada')}
  else if(b.dataset.a==='go')request(u);
  else if(b.dataset.a==='undo'){try{await rpc('deshacer',{url:u.url});const s=st(u);S.state.set(u.url,{...s,solicitado_en:null});S.today=Math.max(0,S.today-1);render()}catch(x){toast(x.message,'err')}}};
new IntersectionObserver(es=>{if(es[0].isIntersecting&&S.shown<S.list.length)more()},{rootMargin:'500px'}).observe($('more'));
$('lockForm').onsubmit=async e=>{e.preventDefault();try{sessionStorage.setItem(PASS,$('lockPw').value)}catch(x){}$('lockErr').textContent='Verificando…';try{await rpc('list');$('lock').hidden=true;load()}catch(x){$('lockErr').textContent=/Clave/.test(x.message)?'Clave incorrecta':'Sin conexión'}};
tokenOk();
if(!pw())lock();else load();
})();

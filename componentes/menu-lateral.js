/* SUPGO · Panel lateral "MENÚ" del header v2.
   Contiene: carrito, inicio, ofertas, categorías (por familias), laboratorios, mi pedido,
   cuenta, favoritos, guías y ayuda por WhatsApp. Usa el índice del catálogo que ya carga header.js. */
(function(){
'use strict';
if(window.__supgoMenuLateral)return;window.__supgoMenuLateral=true;

var WHATSAPP='573137380766';
var LIME='#c8f34b';
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var norm=function(v){return String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim()};
function slug(v){return String(v||'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,110)}

/* Familias: cada categoría entra en la primera familia cuyas palabras coincidan */
var FAMILIES=[
 {key:'proteinas',label:'Proteínas',words:['proteina','whey','isolate','caseina']},
 {key:'creatinas',label:'Creatinas',words:['creatina']},
 {key:'ganadores',label:'Ganadores de masa',words:['ganador','hipercalorica','gainer']},
 {key:'rendimiento',label:'Pre entrenos y rendimiento',words:['pre entreno','preentreno','pre-entreno','aminoacido','bcaa','eaa','glutamina','beta','citrulina','oxido nitrico','arginina','cafeina','hidratacion','electrolito','recuperacion']},
 {key:'peso',label:'Control de peso',words:['quemador','termogen','carnitina','cla','yohimbina','control de peso','detox']},
 {key:'vitaminas',label:'Vitaminas y minerales',words:['vitamina','multivitamin','complejo b','magnesio','calcio','zinc','potasio','selenio','mineral','hierro','biotina','esenciales']},
 {key:'hormonal',label:'Hormonal y testosterona',words:['hormonal','testosterona','testoterona','ashwagandha','inositol','musculo','libido']},
 {key:'bienestar',label:'Salud y bienestar',words:['omega','coq10','colesterol','circulacion','cardio','ginkgo','antioxidante','hepatic','higado','digestion','probiotico','greens','jugo verde','hongo','nootropico','sueno','melatonina','articula','colageno','piel','cabello','calostro','inmun','complemento','salud']},
 {key:'snacks',label:'Snacks y bebidas',words:['snack','barra','galleta','bebida','mantequilla','avena','pancake','alimento']}
];
var OTHER={key:'otros',label:'Más categorías',words:[]};
function familyOf(cat){var n=norm(cat);for(var i=0;i<FAMILIES.length;i++){if(FAMILIES[i].words.some(function(w){return n.indexOf(w)>=0}))return FAMILIES[i]}return OTHER}

function rows(){
 var r=window.__supgoCatalogRows;
 if(Array.isArray(r)&&r.length)return r;
 try{var c=JSON.parse(localStorage.getItem('supgoSearchIndexV2Slug')||'null');if(c&&Array.isArray(c.rows))return c.rows}catch(e){}
 return [];
}
function counts(field){
 var m=new Map();
 rows().forEach(function(it){var p=it&&it.product||it||{};if(p.__deleted||p.__private||p.adminOnly||p.hidden)return;var v=String(p[field]||'').trim();if(v)m.set(v,(m.get(v)||0)+1)});
 return m;
}

/* ---------- estilos ---------- */
function css(){
 if(document.getElementById('supgo-side-css'))return;
 var s=document.createElement('style');s.id='supgo-side-css';
 s.textContent=[
 '.supgo-side-shade{position:fixed;inset:0;background:rgba(10,10,12,.55);z-index:100000;opacity:0;pointer-events:none;transition:opacity .2s}',
 '.supgo-side-shade.open{opacity:1;pointer-events:auto}',
 '.supgo-side{position:fixed;top:0;left:0;bottom:0;width:min(380px,88vw);background:#fff;color:#111;z-index:100001;display:flex;flex-direction:column;transform:translateX(-102%);transition:transform .26s ease;box-shadow:14px 0 40px rgba(0,0,0,.25);font-family:Poppins,Arial,sans-serif}',
 '.supgo-side.open{transform:none}',
 'body.supgo-side-open{overflow:hidden!important}',
 '.supgo-side-head{display:flex;align-items:center;justify-content:space-between;padding:20px 18px;background:#0f1012;color:#fff}',
 '.supgo-side-head strong{font-size:13px;letter-spacing:.16em;font-weight:600}',
 '.supgo-side-head img{width:34px;height:34px;object-fit:contain;margin-right:10px;vertical-align:middle}',
 '.supgo-side-x{border:0;background:none;color:#fff;font-size:30px;line-height:1;cursor:pointer;padding:0 4px}',
 '.supgo-side-body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch}',
 '.supgo-row{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;border:0;border-bottom:1px solid #eeeff2;background:#fff;padding:16px 18px;font:500 15px Poppins,Arial,sans-serif;letter-spacing:0;text-transform:none;color:#1a1a1a;text-align:left;cursor:pointer;text-decoration:none;box-sizing:border-box}',
 '.supgo-row:hover{background:#f7f8f5}',
 '.supgo-row.on{background:#f4fbe0;color:#111;box-shadow:inset 4px 0 0 '+LIME+'}',
 '.supgo-row.lead{font-weight:500}',
 '.supgo-row .r{display:flex;align-items:center;gap:10px;flex:none}',
 '.supgo-row .n{font-size:11px;font-weight:500;letter-spacing:0;border-radius:999px;padding:3px 8px;background:#f0f1ee;color:#555}',
 '.supgo-row .plus{font-size:20px;font-weight:400;color:#888;width:16px;text-align:center}',
 '.supgo-row .ar{font-size:22px;font-weight:400}',
 '.supgo-row.hot{color:#0f7a3b;font-weight:600}',
 '.supgo-row.hot .n{background:#e6f7ec;color:#0f7a3b}',
 '.supgo-sub{display:none;background:#fafaf8;border-bottom:1px solid #eeeff2}',
 '.supgo-sub.open{display:block}',
 '.supgo-subrow{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;border:0;background:none;padding:12px 18px 12px 30px;font:500 14px Poppins,Arial,sans-serif;color:#2a2a2a;text-align:left;cursor:pointer;box-sizing:border-box}',
 '.supgo-subrow:hover{color:#0f7a3b}',
 '.supgo-subrow small{font-size:11px;color:#8a8a8a;font-weight:400}',
 '.supgo-subrow .r{display:flex;align-items:center;gap:10px}',
 '.supgo-sub2{display:none;padding:2px 0 8px}',
 '.supgo-sub2.open{display:block}',
 '.supgo-leaf{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 18px 9px 44px;font:400 13.5px Poppins,Arial,sans-serif;color:#333;text-decoration:none}',
 '.supgo-leaf:hover{color:#0f7a3b}',
 '.supgo-leaf.all{font-weight:500;color:#0f7a3b}',
 '.supgo-leaf small{font-size:11px;color:#999;font-weight:400}',
 '.supgo-side-search{display:block;width:calc(100% - 48px);margin:12px 18px 6px 30px;border:1px solid #dcdcd6;border-radius:10px;padding:10px 12px;font:400 15px Poppins,Arial,sans-serif;box-sizing:border-box}',
 '.supgo-side-empty{padding:16px 30px;color:#888;font-size:13px}',
 '.supgo-side-foot{background:#f5f6f2;padding:20px 18px 24px;border-top:1px solid #e8e9e4}',
 '.supgo-side-foot strong{display:block;font-size:15px;font-weight:600;margin-bottom:12px}',
 '.supgo-side-foot a{display:flex;align-items:center;gap:10px;color:#111;text-decoration:none;font-size:14.5px;font-weight:400}',
 '.supgo-side-foot svg{width:18px;height:18px;color:#25d366}'
 ].join('\n');
 document.head.appendChild(s);
}

var side,shade,openSet=new Set();
function build(){
 if(side)return;
 css();
 shade=document.createElement('div');shade.className='supgo-side-shade';shade.addEventListener('click',close);
 side=document.createElement('aside');side.className='supgo-side';side.id='supgoSide';side.setAttribute('aria-label','Menú');side.setAttribute('aria-hidden','true');
 document.body.append(shade,side);
}

function path(){return location.pathname}
function render(){
 var cats=counts('category'), brands=counts('brand');
 var groups={};
 cats.forEach(function(n,c){var f=familyOf(c);(groups[f.key]=groups[f.key]||{f:f,list:[],total:0});groups[f.key].list.push([c,n]);groups[f.key].total+=n});
 var famOrder=FAMILIES.concat(OTHER).filter(function(f){return groups[f.key]});
 famOrder.forEach(function(f){groups[f.key].list.sort(function(a,b){return b[1]-a[1]||a[0].localeCompare(b[0],'es')})});
 var brandList=[];brands.forEach(function(n,b){brandList.push([b,n])});brandList.sort(function(a,b){return a[0].localeCompare(b[0],'es')});
 var cartN=(document.getElementById('count')||{}).textContent||'0';
 var p=path(), plus=function(k){return openSet.has(k)?'−':'+'};
 var logo=(document.querySelector('#supgo-global-header .liftHeaderLogo')||{}).src||'';
 var html=
 '<div class="supgo-side-head"><strong>'+(logo?'<img src="'+esc(logo)+'" alt="">':'')+'MENÚ</strong><button type="button" class="supgo-side-x" aria-label="Cerrar menú">×</button></div>'+
 '<div class="supgo-side-body">'+
  '<button type="button" class="supgo-row lead" data-act="cart"><span>Ver mi carrito</span><span class="r"><span class="n">'+esc(cartN)+'</span><span class="ar">→</span></span></button>'+
  '<a class="supgo-row'+(/^\/(home\/?)?$/.test(p)?' on':'')+'" href="/"><span>Inicio</span></a>'+
  '<a class="supgo-row hot'+(/^\/ofertas/.test(p)?' on':'')+'" href="/ofertas/"><span>🔥 Ofertas</span></a>'+
  '<button type="button" class="supgo-row'+(/^\/categorias/.test(p)?' on':'')+'" data-toggle="cats"><span>Todas las categorías</span><span class="r"><span class="plus">'+plus('cats')+'</span></span></button>'+
  '<div class="supgo-sub'+(openSet.has('cats')?' open':'')+'" data-sub="cats">'+
   (famOrder.length?famOrder.map(function(f){var g=groups[f.key];return '<button type="button" class="supgo-subrow" data-toggle="f:'+f.key+'"><span>'+esc(f.label)+'</span><span class="r"><small>'+g.total+'</small><span class="plus">'+plus('f:'+f.key)+'</span></span></button>'+
    '<div class="supgo-sub2'+(openSet.has('f:'+f.key)?' open':'')+'" data-sub="f:'+f.key+'">'+
    g.list.map(function(x){return '<a class="supgo-leaf" href="/categorias/'+slug(x[0])+'/"><span>'+esc(x[0])+'</span><small>'+x[1]+'</small></a>'}).join('')+'</div>'}).join('')
    :'<a class="supgo-leaf all" href="/categorias/">Ver todas las categorías</a>')+
   '<a class="supgo-leaf all" href="/categorias/" style="padding-left:30px">Ver todas las categorías →</a>'+
  '</div>'+
  '<button type="button" class="supgo-row'+(/^\/laboratorios/.test(p)?' on':'')+'" data-toggle="brands"><span>Laboratorios</span><span class="r"><span class="plus">'+plus('brands')+'</span></span></button>'+
  '<div class="supgo-sub'+(openSet.has('brands')?' open':'')+'" data-sub="brands">'+
   (brandList.length?'<input type="search" class="supgo-side-search" placeholder="Buscar laboratorio…" aria-label="Buscar laboratorio">'+brandList.map(function(x){return '<a class="supgo-leaf" data-brand href="/laboratorios/'+slug(x[0])+'/" style="padding-left:30px"><span>'+esc(x[0])+'</span><small>'+x[1]+'</small></a>'}).join(''):'')+
   '<a class="supgo-leaf all" href="/laboratorios/" style="padding-left:30px">Ver todos los laboratorios →</a>'+
  '</div>'+
  '<button type="button" class="supgo-row myOrder'+(/^\/mi-pedido/.test(p)?' on':'')+'" data-act="order"><span>Mi pedido</span></button>'+
  '<a class="supgo-row'+(/^\/cuenta/.test(p)?' on':'')+'" href="/cuenta/"><span>Mi cuenta</span></a>'+
  '<a class="supgo-row'+(/^\/favoritos/.test(p)?' on':'')+'" href="/favoritos/"><span>Favoritos</span></a>'+
  '<a class="supgo-row'+(/^\/guias/.test(p)?' on':'')+'" href="/guias/"><span>Guías de compra</span></a>'+
 '</div>'+
 '<div class="supgo-side-foot"><strong>¿Necesitas ayuda?</strong><a href="https://wa.me/'+WHATSAPP+'" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-.9-1.1-1.2-1.7-.1-.2 0-.4.1-.5l.4-.5.3-.4v-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.6.6-.9 1.4-.9 2.2.1 1 .5 1.9 1.1 2.7 1.1 1.6 2.5 2.9 4.3 3.7 1.3.6 2 .6 2.7.5.8-.1 1.6-.7 1.8-1.4.2-.5.2-1 .1-1.4l-.5-.2Z"/></svg>+57 313 738 0766</a></div>';
 side.innerHTML=html;
 bind();
}
function bind(){
 side.querySelector('.supgo-side-x').onclick=close;
 side.querySelectorAll('[data-toggle]').forEach(function(b){b.onclick=function(){
  var k=b.dataset.toggle,sub=side.querySelector('[data-sub="'+k+'"]');if(!sub)return;
  var o=!sub.classList.contains('open');sub.classList.toggle('open',o);o?openSet.add(k):openSet.delete(k);
  var pl=b.querySelector('.plus');if(pl)pl.textContent=o?'−':'+';b.setAttribute('aria-expanded',o);
 }});
 var act=function(a){
  if(a==='cart'){close();var c=document.querySelector('#supgo-global-header .cartDesktop')||document.querySelector('.cartDesktop');if(c)c.click();}
  if(a==='order'){close();if(typeof window.supgoOpenPedidoCompartido==='function')window.supgoOpenPedidoCompartido();else location.assign('/mi-pedido/');}
 };
 side.querySelectorAll('[data-act]').forEach(function(b){b.addEventListener('click',function(){act(b.dataset.act)})});
 var bs=side.querySelector('.supgo-side-search');
 if(bs)bs.oninput=function(){var q=norm(bs.value);side.querySelectorAll('[data-brand]').forEach(function(a){a.hidden=!!q&&norm(a.textContent).indexOf(q)<0})};
 side.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setTimeout(close,30)})});
}
function open(){
 build();
 if(/^\/categorias/.test(path()))openSet.add('cats');
 if(/^\/laboratorios/.test(path()))openSet.add('brands');
 render();
 side.classList.add('open');shade.classList.add('open');side.setAttribute('aria-hidden','false');
 document.body.classList.add('supgo-side-open');
 setTimeout(function(){var x=side.querySelector('.supgo-side-x');x&&x.focus()},60);
}
function close(){if(!side)return;side.classList.remove('open');shade.classList.remove('open');side.setAttribute('aria-hidden','true');document.body.classList.remove('supgo-side-open')}
window.supgoOpenMenu=open;window.supgoCloseMenu=close;
document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
document.addEventListener('supgo:catalog',function(){if(side&&side.classList.contains('open'))render()});

function wire(){
 var b=document.querySelector('#supgo-global-header .supgo-menu-btn');
 if(b&&!b.dataset.wired){b.dataset.wired='1';b.addEventListener('click',open)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
document.addEventListener('supgo:header-ready',wire);
})();

/* SUPGO · Mi catálogo PDF.
   Arma en el navegador un catálogo con los productos y precios actuales (pdf-lib),
   y lo publica en supgo.co/catalogo.pdf o supgo.co/catalogo-entrenador.pdf. */
(function(){
'use strict';
const SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
const SITE='https://supgo.co',WA='573137380766',WA_TXT='313 738 0766';
const LINKS={publico:SITE+'/catalogo.pdf',entrenador:SITE+'/catalogo-entrenador.pdf'};
const HIDE_BRANDS=['venom-pharma','lift-nutrientes'];
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const yes=v=>v===true||v==='true'||v===1||v==='1';
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CO');
const pw=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
const title=s=>{s=String(s||'').trim();return s?s.charAt(0).toUpperCase()+s.slice(1):'Otros'};
const fecha=d=>d.toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'});
const S={rows:[],offers:{},groups:new Map(),variants:new Map(),ver:'publico',cats:null,allCats:[],pdf:null,pdfInfo:null,estado:{},busy:false};

/* ---------- Datos ---------- */
async function rest(path){const r=await fetch(SB+'/rest/v1/'+path,{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});if(!r.ok)throw new Error('Supabase '+r.status);return r.json()}
async function allProducts(){let out=[],from=0;for(;;){const r=await fetch(SB+'/rest/v1/lift_productos?select=id,slug,nombre,marca,categoria,activo,product&activo=eq.true&order=id',{headers:{apikey:KEY,Authorization:'Bearer '+KEY,Range:from+'-'+(from+999)}});if(!r.ok)throw new Error('Supabase '+r.status);const b=await r.json();out=out.concat(b);if(b.length<1000)break;from+=1000}return out}
async function fn(action,extra){
  const r=await fetch(SB+'/functions/v1/lift-mi-catalogo',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action,password:pw()},extra||{}))});
  const j=await r.json().catch(()=>({}));
  if(r.status===401){lock('Clave incorrecta');throw new Error('Clave incorrecta')}
  if(!r.ok||!j.ok)throw new Error(j.error||'Error '+r.status);
  return j;
}
function sync(s,t){const el=$('sync');el.className='sync '+s;el.querySelector('span').textContent=t}
async function load(){
  sync('load','Cargando productos…');
  try{
    const [rows,off,grupos,vars,est]=await Promise.all([
      allProducts(),
      rest('lift_catalog_config?select=valor&clave=eq.weekly_offers&limit=1').catch(()=>[]),
      rest('lift_producto_grupos?select=id,nombre,marca,presentacion,imagen,categoria,visible_publico').catch(()=>[]),
      rest('lift_producto_variantes?select=grupo_id,producto_id,sabor,orden,activo&activo=eq.true').catch(()=>[]),
      fn('estado').catch(e=>{if(/Clave/.test(e.message))throw e;return {estado:{}}})
    ]);
    let o=off&&off[0]&&off[0].valor||{};if(typeof o==='string'){try{o=JSON.parse(o)}catch(e){o={}}}
    S.offers=o&&typeof o==='object'?o:{};
    S.groups=new Map(grupos.filter(g=>g.visible_publico!==false).map(g=>[String(g.id),g]));
    S.variants=new Map();vars.forEach(v=>{if(S.groups.has(String(v.grupo_id)))S.variants.set(String(v.producto_id),v)});
    S.estado=est.estado||{};
    S.rows=rows.map(prep).filter(Boolean);
    const cc={};S.rows.forEach(r=>{cc[r.cat]=(cc[r.cat]||0)+1});
    S.allCats=Object.keys(cc).sort((a,b)=>a.localeCompare(b,'es')).map(c=>({c,n:cc[c]}));
    sync('ok',S.rows.length+' productos visibles en la tienda');
    renderLinks();summary();
  }catch(e){sync('err','Error');if(!/Clave/.test(e.message))toast(e.message,'err')}
}
function prep(r){
  const p=r.product||{},name=String(p.name||r.nombre||'').trim(),brand=String(p.brand||r.marca||'').trim();
  if(!r.activo||!name)return null;
  if(yes(p.__deleted)||yes(p.__private)||yes(p.adminOnly)||yes(p.hidden)||yes(p.oculto)||p.visibility==='admin'||yes(p._checkoutOnly))return null;
  if(/\s-\s*copia\s*$/i.test(name)||HIDE_BRANDS.includes(slug(brand)))return null;
  const price=Number(p.price)||0;if(!(price>0))return null;
  let fl=p.flavors;if(typeof fl==='string')fl=fl.split(/[,\n;|]/);fl=Array.isArray(fl)?fl.map(x=>String(typeof x==='object'&&x?(x.name||x.sabor||''):x).trim()).filter(Boolean):[];
  if(!fl.length&&p.flavor)fl=[String(p.flavor).trim()];
  const img=String(p.image||'').trim();
  return {id:String(r.id),name,brand,cat:title(r.categoria||p.category),pres:String(p.presentation||'').trim(),flavors:[...new Set(fl)],img:/^(https?:|data:image\/)/.test(img)?img:'',
    slug:/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug||'')?r.slug:'',price,trainer:Number(p.trainerPrice)>0?Number(p.trainerPrice):price,offer:offerFor(r.id,price)};
}
function offerFor(id,regular){const o=S.offers[String(id)];if(!o||typeof o!=='object')return 0;const s=Number(o.price);if(!(s>0&&s<regular))return 0;if(o.promoUntil){const t=Date.parse(o.promoUntil);if(isFinite(t)&&Date.now()>t)return 0}return s}

/* ---------- Selección ---------- */
function items(){
  const cats=S.cats,soloFoto=$('soloFoto').checked,soloOferta=$('soloOferta').checked,unir=$('unirSabores').checked,ent=S.ver==='entrenador';
  let L=S.rows.filter(r=>(!cats||cats.has(r.cat)));
  const shown=r=>ent?r.trainer:(r.offer||r.price);
  const out=[],byGroup=new Map();
  for(const r of L){
    const v=unir&&S.variants.get(r.id);
    if(v){const k=String(v.grupo_id);if(!byGroup.has(k))byGroup.set(k,[]);byGroup.get(k).push({r,v});continue}
    out.push({name:r.name,brand:r.brand,cat:r.cat,pres:r.pres,flavors:r.flavors,img:r.img,slug:r.slug,price:shown(r),old:!ent&&r.offer?r.price:0,from:false});
  }
  byGroup.forEach((ms,k)=>{
    const g=S.groups.get(k);ms.sort((a,b)=>(a.v.orden||0)-(b.v.orden||0));
    const prices=ms.map(m=>shown(m.r)),min=Math.min(...prices),cheap=ms[prices.indexOf(min)].r;
    const fl=[...new Set(ms.map(m=>String(m.v.sabor||'').trim()||m.r.flavors[0]||'').filter(Boolean))];
    out.push({name:String(g.nombre||cheap.name),brand:String(g.marca||cheap.brand),cat:cheap.cat,pres:String(g.presentacion||cheap.pres||''),flavors:fl,
      img:/^(https?:|data:image\/)/.test(String(g.imagen||''))?g.imagen:(ms.find(m=>m.r.img)||{r:{}}).r.img||'',slug:(ms.find(m=>m.r.slug)||{r:{}}).r.slug||'',
      price:min,old:!ent&&cheap.offer?cheap.price:0,from:Math.max(...prices)>min});
  });
  let R=out.filter(x=>(!soloFoto||x.img)&&(!soloOferta||x.old));
  const ord=$('orden').value;
  R.sort(ord==='marca'?(a,b)=>a.brand.localeCompare(b.brand,'es')||a.name.localeCompare(b.name,'es'):(a,b)=>a.cat.localeCompare(b.cat,'es')||a.brand.localeCompare(b.brand,'es')||a.name.localeCompare(b.name,'es'));
  return R;
}
function summary(){
  const L=items(),secs=new Set(L.map(x=>$('orden').value==='marca'?x.brand:x.cat)).size,pages=Math.max(1,Math.ceil((L.length+secs*1.5)/9))+1;
  $('sum').innerHTML=L.length?`<b>${L.length}</b> productos · <b>${secs}</b> ${$('orden').value==='marca'?'marcas':'categorías'} · unas <b>${pages}</b> páginas`+(L.length>400?'<br>Son muchos productos: generarlo puede tardar 1 o 2 minutos.':''):'No hay productos con estos filtros.';
  $('genBtn').disabled=!L.length;
  $('catBtn').textContent=!S.cats?'Todas':S.cats.size===1?[...S.cats][0]:S.cats.size+' categorías';
}
function renderLinks(){
  $('links').innerHTML=['publico','entrenador'].map(v=>{
    const e=S.estado[v],url=LINKS[v],lbl=v==='publico'?'Catálogo público':'Catálogo entrenador';
    if(!e)return `<div class="lk off"><span class="eb" style="color:var(--muted)">${lbl}</span><b>${url.replace('https://','')}</b><small>Aún no publicado. Genera el PDF y toca “Publicar”.</small></div>`;
    const msg=encodeURIComponent((v==='publico'?'Te comparto nuestro catálogo SUPGO con precios actualizados 💪 ':'Catálogo SUPGO con precios de entrenador 💪 ')+url);
    return `<div class="lk"><span class="eb">${lbl}</span><b>${url.replace('https://','')}</b><small>Actualizado ${fecha(new Date(e.actualizado))} · ${e.productos} productos · ${e.paginas} págs</small>
      <div class="acts"><a class="wa" href="https://wa.me/?text=${msg}" target="_blank" rel="noopener">WhatsApp</a><button data-copy="${url}">Copiar enlace</button><a href="${url}?v=${Date.parse(e.actualizado)||''}" target="_blank" rel="noopener">Abrir</a></div></div>`;
  }).join('');
}

/* ---------- Imágenes ---------- */
const imgCache=new Map();
async function jpegOf(url){
  if(imgCache.has(url))return imgCache.get(url);
  const p=(async()=>{
    const r=await fetch(url,{mode:'cors',cache:'force-cache'});if(!r.ok)throw new Error('img');
    const blob=await r.blob();
    let bmp;
    try{bmp=await createImageBitmap(blob)}catch(e){bmp=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(blob)})}
    const w=bmp.width,h=bmp.height,M=300,k=Math.min(1,M/Math.max(w,h)),cw=Math.max(1,Math.round(w*k)),ch=Math.max(1,Math.round(h*k));
    const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cw,ch);x.drawImage(bmp,0,0,cw,ch);
    const b=await new Promise(res=>c.toBlob(res,'image/jpeg',.74));
    return {bytes:new Uint8Array(await b.arrayBuffer()),w:cw,h:ch};
  })().catch(()=>null);
  imgCache.set(url,p);return p;
}
async function pool(list,n,fnc,onStep){let i=0,done=0;const run=async()=>{while(i<list.length){const k=i++;await fnc(list[k],k);done++;onStep&&onStep(done)}};await Promise.all(Array.from({length:Math.min(n,list.length)},run))}

/* ---------- PDF ---------- */
const WIN=new Set('–—‘’‚“”„•…€™¡¿°ºª·×'.split(''));
const clean=s=>[...String(s||'')].map(ch=>{const c=ch.codePointAt(0);if(c===9||c===10)return ' ';if(c<32||(c>=127&&c<160))return '';if(c<256||WIN.has(ch))return ch;if(ch==='″'||ch==='＂')return '"';return ''}).join('').replace(/\s+/g,' ').trim();
function wrap(text,font,size,maxW,maxLines){
  const words=clean(text).split(' ').filter(Boolean),lines=[];let cur='';
  for(const w of words){const t=cur?cur+' '+w:w;if(font.widthOfTextAtSize(t,size)<=maxW)cur=t;else{if(cur)lines.push(cur);cur=w;while(font.widthOfTextAtSize(cur,size)>maxW&&cur.length>1){/* palabra larguísima */let cut=cur.length-1;while(cut>1&&font.widthOfTextAtSize(cur.slice(0,cut),size)>maxW)cut--;lines.push(cur.slice(0,cut));cur=cur.slice(cut)}}if(lines.length>=maxLines)break}
  if(cur&&lines.length<maxLines)lines.push(cur);
  const used=lines.join(' ').length;
  if(lines.length===maxLines&&used<clean(text).length){let l=lines[maxLines-1];while(l&&font.widthOfTextAtSize(l+'…',size)>maxW)l=l.slice(0,-1);lines[maxLines-1]=l.trim()+'…'}
  return lines;
}
async function generate(){
  if(S.busy)return;S.busy=true;
  const L=items();$('result').hidden=true;$('prog').hidden=false;$('genBtn').disabled=true;
  const step=(p,t)=>{$('progBar').style.width=Math.round(p*100)+'%';$('progTxt').textContent=t};
  try{
    const {PDFDocument,StandardFonts,rgb,PDFName,PDFString}=PDFLib;
    const doc=await PDFDocument.create();
    doc.setTitle('Catálogo SUPGO'+(S.ver==='entrenador'?' · Entrenador':''));doc.setAuthor('SUPGO');doc.setCreator('SUPGO CONTROL');doc.setLanguage('es-CO');
    const F=await doc.embedFont(StandardFonts.Helvetica),B=await doc.embedFont(StandardFonts.HelveticaBold);
    const INK=rgb(.043,.059,.047),LIME=rgb(.776,.957,.196),MUT=rgb(.42,.45,.42),LINE=rgb(.89,.91,.886),SOFT=rgb(.965,.97,.96),WHITE=rgb(1,1,1),RED=rgb(.78,.16,.16);
    const W=595.28,H=841.89,M=28,G=10,COLS=3,CW=(W-2*M-(COLS-1)*G)/COLS,CH=224,IMGH=128,TOP=H-52,BOT=44;

    /* Fotos */
    const urls=[...new Set(L.map(x=>x.img).filter(Boolean))],imgs=new Map();
    step(0,'Cargando fotos… 0 de '+urls.length);
    await pool(urls,8,async u=>{const j=await jpegOf(u);if(j)imgs.set(u,j)},d=>step(d/urls.length*.8,'Cargando fotos… '+d+' de '+urls.length));
    step(.82,'Armando páginas…');
    const emb=new Map();for(const [u,j] of imgs){try{emb.set(u,await doc.embedJpg(j.bytes))}catch(e){}}

    const today=new Date(),dateTxt=fecha(today),ent=S.ver==='entrenador';
    const link=(page,x,y,w,h,url)=>{const a=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[x,y,x+w,y+h],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(url)}}));let arr=page.node.lookup(PDFName.of('Annots'));if(!arr){arr=doc.context.obj([]);page.node.set(PDFName.of('Annots'),arr)}arr.push(a)};
    const rr=(page,x,y,w,h,r,o)=>{const p=`M ${r} 0 H ${w-r} Q ${w} 0 ${w} ${r} V ${h-r} Q ${w} ${h} ${w-r} ${h} H ${r} Q 0 ${h} 0 ${h-r} V ${r} Q 0 0 ${r} 0 Z`;page.drawSvgPath(p,Object.assign({x,y:y+h},o))};
    const txt=(page,s,x,y,size,font,color)=>page.drawText(clean(s),{x,y,size,font,color});

    /* Portada */
    const secName=x=>$('orden').value==='marca'?x.brand:x.cat;
    const secs=[...new Set(L.map(secName))];
    const cv=doc.addPage([W,H]);
    cv.drawRectangle({x:0,y:0,width:W,height:H,color:INK});
    cv.drawRectangle({x:M,y:H-120,width:60,height:6,color:LIME});
    txt(cv,'SUPGO',M,H-200,78,B,WHITE);
    txt(cv,'Catálogo de suplementos',M,H-240,24,F,WHITE);
    rr(cv,M,H-300,ent?190:150,30,15,{color:LIME});
    txt(cv,ent?'PRECIO ENTRENADOR':'PRECIO PÚBLICO',M+14,H-290,11,B,INK);
    txt(cv,'Precios actualizados el '+dateTxt,M,H-335,12,F,rgb(.75,.79,.75));
    txt(cv,L.length+' productos · '+secs.length+($('orden').value==='marca'?' marcas':' categorías'),M,H-353,12,F,rgb(.75,.79,.75));
    let cy=H-410;txt(cv,$('orden').value==='marca'?'MARCAS':'CATEGORÍAS',M,cy,9,B,LIME);cy-=18;
    {const LH=13.5,rows=Math.floor((cy-150)/LH),ncol=Math.min(3,Math.max(2,Math.ceil(secs.length/rows))),colW=(W-2*M)/ncol,max=rows*ncol,list=secs.length>max?secs.slice(0,max-1):secs;
     list.forEach((s,i)=>{const cx=M+Math.floor(i/rows)*colW,yy=cy-(i%rows)*LH;txt(cv,wrap(s,F,9.5,colW-10,1)[0]||'',cx,yy,9.5,F,WHITE)});
     if(secs.length>max)txt(cv,'y '+(secs.length-max+1)+' más…',M+(ncol-1)*colW,cy-(rows-1)*LH,9.5,F,rgb(.75,.79,.75));}
    rr(cv,M,64,W-2*M,64,14,{color:rgb(.09,.12,.1)});
    txt(cv,'Pide por WhatsApp',M+18,104,10,F,rgb(.75,.79,.75));txt(cv,WA_TXT,M+18,82,18,B,LIME);
    txt(cv,'Compra en línea',W/2+8,104,10,F,rgb(.75,.79,.75));txt(cv,'supgo.co',W/2+8,82,18,B,WHITE);
    link(cv,M,64,(W-2*M)/2,64,'https://wa.me/'+WA+'?text='+encodeURIComponent('Hola SUPGO, vi el catálogo y quiero hacer un pedido'));link(cv,W/2,64,(W-2*M)/2,64,SITE+'/');
    txt(cv,'Precios en pesos colombianos. Sujetos a cambio y disponibilidad.',M,40,8.5,F,rgb(.55,.6,.55));

    /* Páginas de productos */
    let page=null,y=0,col=0,pn=1;
    const newPage=()=>{page=doc.addPage([W,H]);pn++;y=TOP;col=0;
      page.drawRectangle({x:0,y:H-34,width:W,height:34,color:INK});
      txt(page,'SUPGO',M,H-22,12,B,LIME);txt(page,ent?'Catálogo · precio entrenador':'Catálogo',M+50,H-22,9,F,WHITE);
      const d='Precios al '+dateTxt;txt(page,d,W-M-F.widthOfTextAtSize(clean(d),8.5),H-22,8.5,F,rgb(.75,.79,.75));
      page.drawLine({start:{x:M,y:BOT-10},end:{x:W-M,y:BOT-10},thickness:.6,color:LINE});
      txt(page,'Pide por WhatsApp '+WA_TXT+' · supgo.co',M,BOT-24,8,F,MUT);
      const n=String(pn);txt(page,n,W-M-F.widthOfTextAtSize(n,8),BOT-24,8,B,MUT);
      link(page,M,BOT-30,200,16,'https://wa.me/'+WA);
    };
    let curSec=null;
    for(const x of L){
      const s=secName(x);
      if(s!==curSec){
        if(col!==0){y-=CH+G;col=0}
        if(!page||y-28-CH<BOT)newPage();
        page.drawRectangle({x:M,y:y-20,width:4,height:16,color:LIME});
        txt(page,s,M+12,y-16,13,B,INK);
        y-=30;curSec=s;
      }
      if(!page||y-CH<BOT){newPage();txt(page,s+' (continuación)',M,y-12,9,B,MUT);y-=22}
      const cx=M+col*(CW+G),top=y,cardY=top-CH;
      rr(page,cx,cardY,CW,CH,10,{color:WHITE,borderColor:LINE,borderWidth:.8});
      rr(page,cx+6,top-6-IMGH,CW-12,IMGH,7,{color:SOFT});
      const im=x.img&&emb.get(x.img);
      if(im){const bw=CW-24,bh=IMGH-12,k=Math.min(bw/im.width,bh/im.height),iw=im.width*k,ih=im.height*k;page.drawImage(im,{x:cx+6+(CW-12-iw)/2,y:top-6-IMGH+(IMGH-ih)/2,width:iw,height:ih})}
      else{const ini=clean(x.brand||x.name).charAt(0).toUpperCase()||'S';txt(page,ini,cx+CW/2-B.widthOfTextAtSize(ini,36)/2,top-6-IMGH/2-12,36,B,LINE)}
      if(x.old){const pct=Math.min(99,Math.round((1-x.price/x.old)*100)),lb='OFERTA'+(pct>0?' -'+pct+'%':''),bw=B.widthOfTextAtSize(lb,7.5)+14;rr(page,cx+11,top-26,bw,15,7.5,{color:LIME});txt(page,lb,cx+18,top-21.5,7.5,B,INK)}
      let ty=top-IMGH-20;const tx=cx+10,tw=CW-20;
      txt(page,wrap(String(x.brand).toUpperCase(),B,7,tw,1)[0]||'',tx,ty,7,B,MUT);ty-=12;
      wrap(x.name,B,9.5,tw,2).forEach(l=>{txt(page,l,tx,ty,9.5,B,INK);ty-=11.5});
      if(x.pres){txt(page,wrap(x.pres,F,7.8,tw,1)[0]||'',tx,ty,7.8,F,MUT);ty-=10}
      if(x.flavors.length>1||(x.flavors.length===1&&!new RegExp(x.flavors[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(x.name))){
        wrap((x.flavors.length>1?'Sabores: ':'Sabor: ')+x.flavors.join(', '),F,7.2,tw,2).forEach(l=>{txt(page,l,tx,ty,7.2,F,MUT);ty-=9});
      }
      const py=cardY+12;let px=tx;
      if(x.from){txt(page,'Desde',px,py+15,7,F,MUT)}
      const ps=money(x.price);txt(page,ps,px,py,14,B,x.old?RED:INK);px+=B.widthOfTextAtSize(ps,14)+6;
      if(x.old){const os=money(x.old),ow=F.widthOfTextAtSize(os,8.5);txt(page,os,px,py+1,8.5,F,MUT);page.drawLine({start:{x:px,y:py+4},end:{x:px+ow,y:py+4},thickness:.8,color:MUT})}
      if(x.slug)link(page,cx,cardY,CW,CH,SITE+'/producto/'+x.slug+'/');
      col++;if(col===COLS){col=0;y-=CH+G}
    }
    step(.95,'Guardando PDF…');
    const bytes=await doc.save();
    if(S.pdf)URL.revokeObjectURL(S.pdf.url);
    const blob=new Blob([bytes],{type:'application/pdf'});
    S.pdf={blob,url:URL.createObjectURL(blob),ver:S.ver};
    S.pdfInfo={productos:L.length,paginas:doc.getPageCount(),bytes:bytes.length,sinFoto:L.filter(x=>x.img&&!emb.get(x.img)).length};
    step(1,'Listo');
    $('resT').textContent='PDF listo · '+(S.ver==='entrenador'?'precio entrenador':'precio público');
    $('resS').textContent=S.pdfInfo.paginas+' páginas · '+S.pdfInfo.productos+' productos · '+(bytes.length/1048576).toFixed(1)+' MB'+(S.pdfInfo.sinFoto?' · '+S.pdfInfo.sinFoto+' fotos no cargaron':'');
    $('pubBtn').textContent='🌐 Publicar en '+LINKS[S.ver].replace('https://','');
    $('result').hidden=false;$('prog').hidden=true;
  }catch(e){toast('No se pudo generar: '+(e.message||e),'err');$('prog').hidden=true}
  S.busy=false;$('genBtn').disabled=false;
}
async function publish(){
  if(!S.pdf)return;const b=$('pubBtn'),old=b.textContent;b.disabled=true;b.textContent='Publicando…';
  try{
    const u=await fn('upload-url',{version:S.pdf.ver});
    const r=await fetch(u.signedUrl,{method:'PUT',headers:{'content-type':'application/pdf','x-upsert':'true','cache-control':'max-age=60'},body:S.pdf.blob});
    if(!r.ok){const t=await r.text().catch(()=>'');throw new Error('No se pudo subir ('+r.status+') '+t.slice(0,120))}
    const filtros=[S.cats?[...S.cats].join(', '):'Todas las categorías',$('soloOferta').checked?'solo ofertas':''].filter(Boolean).join(' · ');
    const j=await fn('publicado',{version:S.pdf.ver,productos:S.pdfInfo.productos,paginas:S.pdfInfo.paginas,bytes:S.pdfInfo.bytes,filtros});
    S.estado=j.estado||S.estado;renderLinks();toast('Publicado en '+LINKS[S.pdf.ver].replace('https://','')+' ✓');
    b.textContent='✓ Publicado';setTimeout(()=>{b.textContent=old;b.disabled=false},2500);return;
  }catch(e){toast(e.message,'err')}
  b.textContent=old;b.disabled=false;
}

/* ---------- Varios ---------- */
function toast(m,k){const t=document.createElement('div');t.className='toast'+(k==='err'?' err':'');t.innerHTML='<span>'+esc(m)+'</span>';$('toasts').appendChild(t);while($('toasts').children.length>3)$('toasts').firstChild.remove();setTimeout(()=>t.remove(),4500)}
function lock(m){$('lock').hidden=false;$('lockErr').textContent=m||'';setTimeout(()=>$('lockPw').focus(),50)}
async function copy(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(x){}a.remove();return ok}}
function openCats(){
  $('catList').innerHTML=S.allCats.map(o=>`<label><input type="checkbox" value="${esc(o.c)}"${!S.cats||S.cats.has(o.c)?' checked':''}><span>${esc(o.c)}</span><small>${o.n}</small></label>`).join('');
  $('catDlg').hidden=false;
}
function closeCats(){const sel=[...$('catList').querySelectorAll('input:checked')].map(i=>i.value);S.cats=sel.length===S.allCats.length?null:new Set(sel);$('catDlg').hidden=true;summary();invalidate()}
function invalidate(){$('result').hidden=true}

try{if(window.top!==window)document.documentElement.classList.add('embedded')}catch(e){document.documentElement.classList.add('embedded')}
$('ver').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;S.ver=b.dataset.v;[...$('ver').children].forEach(x=>x.classList.toggle('on',x===b));summary();invalidate()};
['orden','soloFoto','soloOferta','unirSabores'].forEach(id=>$(id).addEventListener('change',()=>{summary();invalidate()}));
$('catBtn').onclick=openCats;$('catOk').onclick=closeCats;
$('catAll').onclick=()=>$('catList').querySelectorAll('input').forEach(i=>i.checked=true);
$('catNone').onclick=()=>$('catList').querySelectorAll('input').forEach(i=>i.checked=false);
$('genBtn').onclick=generate;$('pubBtn').onclick=publish;
$('viewBtn').onclick=()=>{if(S.pdf)window.open(S.pdf.url,'_blank')};
$('dlBtn').onclick=()=>{if(!S.pdf)return;const a=document.createElement('a');a.href=S.pdf.url;a.download='catalogo-supgo'+(S.pdf.ver==='entrenador'?'-entrenador':'')+'.pdf';document.body.appendChild(a);a.click();a.remove()};
$('links').onclick=async e=>{const b=e.target.closest('[data-copy]');if(b&&await copy(b.dataset.copy))toast('Enlace copiado')};
$('lockForm').onsubmit=async e=>{e.preventDefault();try{sessionStorage.setItem(PASS,$('lockPw').value)}catch(x){}$('lockErr').textContent='Verificando…';try{await fn('estado');$('lock').hidden=true;load()}catch(x){$('lockErr').textContent=/Clave/.test(x.message)?'Clave incorrecta':'Sin conexión'}};
if(!pw())lock();else load();
})();

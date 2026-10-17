
(function(){
 const ids=['Keyword','Related','Title','Slug','Meta','Html','Alt1','Alt2','Sku','Gtin','Manufacturer'];
 const el=k=>document.getElementById('liftSeo'+k);
 const count=(s,phrase)=>{if(!phrase)return 0;const escaped=phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');try{return (s.match(new RegExp('(^|[^\\p{L}\\p{N}])'+escaped+'(?=$|[^\\p{L}\\p{N}])','giu'))||[]).length}catch(e){return s.toLowerCase().split(phrase.toLowerCase()).length-1}};
 const textOf=html=>{const d=document.createElement('div');d.innerHTML=html;d.querySelectorAll('script,style').forEach(n=>n.remove());return d.textContent||''};
 const slugify=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 window.liftSeoRead=()=>Object.fromEntries(ids.map(k=>[k.toLowerCase(),el(k)?.value.trim()||'']));
 window.liftSeoLoad=data=>{ids.forEach(k=>{if(el(k))el(k).value=data[k.toLowerCase()]||''});audit()};
 window.liftSeoClear=()=>window.liftSeoLoad({});
 function audit(){
  if(!el('Keyword'))return;
  const v=window.liftSeoRead(),keyword=v.keyword,related=v.related.split('\n').map(x=>x.trim()).filter(Boolean),plain=textOf(v.html),words=plain.trim().split(/\s+/).filter(Boolean).length,occ=count(plain,keyword);
  const first=(plain.trim().split(/\n/)[0]||'').toLowerCase();
  const doc=document.createElement('div');doc.innerHTML=v.html;
  const links=[...doc.querySelectorAll('a[href]')];const internal=links.some(a=>/^\/(creatinas|ganadores|pre-entrenos|proteinas)(\/|$)/.test(a.getAttribute('href')||''));
  const external=links.some(a=>{try{const u=new URL(a.getAttribute('href'),location.origin);return u.protocol==='https:'&&u.hostname!==location.hostname}catch(e){return false}});
  const checks=[['Frase objetivo de 1 a 4 palabras',!!keyword&&keyword.split(/\s+/).length<=4],['Título SEO máximo 60 caracteres',!!v.title&&v.title.length<=60],['Slug definido',!!v.slug],['Metadescripción incluye frase objetivo',!!keyword&&v.meta.toLowerCase().includes(keyword.toLowerCase())],['Descripción más de 300 palabras',words>300],['Frase objetivo 6 a 8 veces ('+occ+')',occ>=6&&occ<=8],['Frase objetivo en primera línea',!!keyword&&first.includes(keyword.toLowerCase())],['4 frases relacionadas de máximo 4 palabras',related.length===4&&related.every(x=>x.split(/\s+/).length<=4)],['4 frases relacionadas dentro del HTML',related.length===4&&related.every(x=>count(plain,x)>=1)],['Frases relacionadas fuera de enlaces',related.every(x=>!links.some(a=>count(a.textContent||'',x)>0))],['Enlace interno a categorías',internal],['Enlace externo HTTPS',external],['2 textos ALT con frase objetivo',!!keyword&&v.alt1.toLowerCase().includes(keyword.toLowerCase())&&v.alt2.toLowerCase().includes(keyword.toLowerCase())]];
  const ok=checks.filter(x=>x[1]).length;
  el('Signals').innerHTML=checks.map(([name,valid])=>'<div style="padding:4px 0">'+(valid?'🟢':'🔴')+' '+name+'</div>').join('');
  el('Overall').textContent=(ok===checks.length?'🟢':ok===0?'🔴':'🟡')+' '+ok+'/'+checks.length;
  const name=document.getElementById('lafName')?.value.trim()||'Producto sin nombre';
  const image=document.getElementById('lafImage')?.value.trim()||'';
  const brand=document.getElementById('lafBrand')?.value.trim()||'';
  const price=Number((document.getElementById('lafPrice')?.value||'').replace(/[^\d]/g,''));
  const status=document.getElementById('lafStatus')?.value==='out'?'https://schema.org/OutOfStock':'https://schema.org/InStock';
  const schema={'@context':'https://schema.org','@type':'Product',name,description:v.meta||document.getElementById('lafDescription')?.value||'',...(image?{image:[image]}:{}),...(brand?{brand:{'@type':'Brand',name:brand}}:{}),...(v.sku?{sku:v.sku}:{}),...(v.gtin?{gtin:v.gtin}:{}),...(price>0?{offers:{'@type':'Offer',priceCurrency:'COP',price:String(price),availability:status,...(v.slug?{url:location.origin+'/productos/'+slugify(v.slug)}:{})}}:{})};
  el('Json').value=JSON.stringify(schema,null,2);
 }
 document.addEventListener('input',e=>{if(e.target.closest('#liftSeoEditor')||['lafName','lafPrice','lafBrand','lafImage','lafStatus','lafDescription'].includes(e.target.id))audit()});
 document.addEventListener('change',e=>{if(e.target.id==='lafStatus')audit()});
 document.addEventListener('DOMContentLoaded',audit);
})();

/* SUPGO - Fuente XML dinámica de Merchant Center. Solo lectura. */
'use strict';
const API='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/';
const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const BASE='https://supgo.co';
const headers={apikey:KEY,Accept:'application/json'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const validSlug=v=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(v||''));
const str=v=>String(v??'').trim();
const clean=v=>str(v).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,4800);
async function all(table, select, extra={}) {
  const out=[];
  for(let offset=0;offset<20000;offset+=750){
    const qs=new URLSearchParams({select,...extra,limit:'750',offset:String(offset)});
    const resp=await fetch(API+table+'?'+qs,{headers,signal:AbortSignal.timeout(14000)});
    if(!resp.ok)throw new Error(table+' HTTP '+resp.status);
    const batch=await resp.json();
    if(!Array.isArray(batch))throw new Error('Respuesta inválida de '+table);
    out.push(...batch);
    if(batch.length<750)return out;
  }
  throw new Error('Paginación excedida '+table);
}
const element=(key,value)=>'<'+key+'>'+esc(value)+'</'+key+'>';
module.exports=async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method))return res.status(405).send('Método no permitido');
 try {
  const [products,seo,brands,blocks,familias]=await Promise.all([
   all('lift_productos','id,slug,activo,nombre,marca,precio,imagen,product',{activo:'eq.true',order:'id.asc'}),
   all('lift_producto_seo','producto_id,titulo_seo,meta_descripcion,imagen_seo,indexable',{}),
   all('lift_seo_marcas','marca,habilitada',{}),
   all('lift_seo_bloqueos','producto_id',{}),
   all('lift_familias_publicas','producto_id,grupo_id,slug,tamano',{}).catch(()=>[])
  ]);
  // Productos variables: cada variación es un artículo del mismo grupo y enlaza a la URL del padre.
  const famById=new Map(familias.map(f=>[String(f.producto_id),f]));
  const seoById=new Map(seo.map(x=>[String(x.producto_id),x]));
  const enabledBrands=new Map();
  for(const b of brands){
   const k=str(b.marca).toLocaleLowerCase('es');
   enabledBrands.set(k,!enabledBrands.has(k)&&b.habilitada===true);
  }
  const blocked=new Set(blocks.map(x=>String(x.producto_id)));
  const counts=new Map();
  for(const p of products)if(validSlug(p.slug))counts.set(p.slug,(counts.get(p.slug)||0)+1);
  const items=[];
  for(const row of products){
   const p=row.product||{}, s=seoById.get(String(row.id))||{};
   const title=str(p.name||p.nombre||row.nombre), brand=str(p.brand||p.marca||row.marca);
   const slug=str(row.slug), image=str(s.imagen_seo||p.image||p.imagen||row.imagen);
   const price=Number(p.price??p.precio??row.precio);
   const description=clean(s.meta_descripcion||p.description||p.descripcion||title);
   if(row.activo!==true||!validSlug(slug)||counts.get(slug)!==1||
      !title||!brand||!Number.isFinite(price)||price<=0||
      !/^https:\/\//i.test(image)||!description||
      p.__deleted||p.__private||p.adminOnly||p.hidden||p.oculto||
      p.visibility==='admin'||s.indexable===false||blocked.has(String(row.id))||
      enabledBrands.get(brand.toLocaleLowerCase('es'))!==true)continue;
   const fam=famById.get(String(row.id));
   const link=fam?BASE+'/producto/'+fam.slug+'/?v='+row.id:BASE+'/producto/'+slug+'/';
   // La marca y el bloqueo coinciden con las verificaciones de indexación de la ficha SSR.
   const fields=[
    element('g:id',row.id),
    element('g:title',title),
    element('g:description',description),
    element('g:link',link),
    element('g:image_link',image),
    element('g:price',price.toFixed(0)+' COP'),
    element('g:availability','in_stock'),
    element('g:condition','new'),
    element('g:brand',brand),
    element('g:identifier_exists','no')
   ];
   if(fam){fields.push(element('g:item_group_id','supgo-'+fam.grupo_id));if(str(fam.tamano))fields.push(element('g:size',fam.tamano))}
   items.push('<item>'+fields.join('')+'</item>');
  }
  if(!items.length)throw new Error('No hay artículos válidos; no se publica una fuente vacía');
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+
   '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>'+
   element('title','SUPGO - Productos')+element('link',BASE)+
   element('description','Catálogo dinámico de SUPGO Colombia')+
   items.join('')+'</channel></rss>';
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-SUPGO-Product-Count',String(items.length));
  return res.status(200).send(req.method==='HEAD'?'':xml);
 }catch(err){
  console.error('SUPGO Merchant feed:',err.message);
  res.setHeader('Cache-Control','no-store');
  return res.status(503).send('Fuente de productos temporalmente no disponible');
 }
};

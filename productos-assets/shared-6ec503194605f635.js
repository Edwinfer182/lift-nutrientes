
(function(){
 const SB='https://vdxkknftyssjyfbdieqa.supabase.co';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const headers={apikey:KEY};
 async function load(){
   try{
     const [gr,vr]=await Promise.all([
       fetch(SB+'/rest/v1/lift_producto_grupos?select=id,nombre,marca,presentacion,precio,imagen,categoria,visible_publico&visible_publico=eq.true&order=id.asc',{headers,cache:'no-store'}),
       fetch(SB+'/rest/v1/lift_producto_variantes?select=id,grupo_id,producto_id,sabor,imagen,precio,orden,activo,tipo_variacion,sku&activo=eq.true&order=grupo_id.asc,orden.asc,id.asc',{headers,cache:'no-store'})
     ]);
     if(!gr.ok)throw new Error('No se pudieron leer los grupos ('+gr.status+')');
     if(!vr.ok)throw new Error('No se pudieron leer las variantes ('+vr.status+')');
     const groups=await gr.json();
     const variants=await vr.json();
     const byGroup=new Map();
     for(const v of (Array.isArray(variants)?variants:[])){
       const k=String(v.grupo_id);
       if(!byGroup.has(k))byGroup.set(k,[]);
       byGroup.get(k).push(v);
     }
     window.LIFT_PUBLIC_VARIANT_GROUPS=(Array.isArray(groups)?groups:[]).map(g=>({...g,lift_producto_variantes:byGroup.get(String(g.id))||[]}));
     if(typeof render==='function')render();
     const q=document.getElementById('q');
     if(q&&q.value.trim()&&typeof renderQuickSearch==='function')renderQuickSearch(q.value);
   }catch(e){
     console.warn('LIFT grupos de variaciones:',e);
     /* Seguridad: si falla la consulta de grupos NO tocamos PRODUCTS ni ocultamos el catálogo. */
     window.LIFT_PUBLIC_VARIANT_GROUPS=[];
     if(typeof render==='function')render();
   }
 }
 window.liftReloadVariantGroups=load;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,80),{once:true});
 else setTimeout(load,80);
})();

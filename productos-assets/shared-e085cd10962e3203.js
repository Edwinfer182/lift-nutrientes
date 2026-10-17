
/* Un único parser de pesos COP para tarjeta y administrador. Nunca convertir 450.000 en 450. */
window.liftVariantMoney=function(value){
 if(typeof value==='number')return Number.isFinite(value)?Math.round(value):0;
 let s=String(value??'').trim().replace(/[^\d.,-]/g,'');
 if(!s)return 0;
 const negative=s.startsWith('-');s=s.replace(/-/g,'');
 const lastComma=s.lastIndexOf(','),lastDot=s.lastIndexOf('.');
 if(lastComma>=0&&lastDot>=0){
   const decimal=lastComma>lastDot?',':'.';
   const parts=s.split(decimal);const frac=parts.pop();
   s=parts.join('').replace(/[.,]/g,'')+(frac.length===3?'':'.'+frac);
   if(frac.length===3)s+=frac;
 }else if(/[.,]/.test(s)){
   const separator=s.includes(',')?',':'.';const parts=s.split(separator);
   if(parts.length>2||parts[parts.length-1].length===3)s=parts.join('');
   else s=parts.join('.');
 }
 const n=Number(s);return Number.isFinite(n)?Math.round((negative?-1:1)*n):0;
};

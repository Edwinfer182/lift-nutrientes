
(function(){
 const DATA={
  envios:{
   title:'Envíos',
   html:`<p>Realizamos entregas en Medellín y envíos a nivel nacional.</p>
   <h3>Medellín y área metropolitana</h3><p>Los pedidos pueden programarse en ruta. La ruta incluye varios pedidos, por lo que no se maneja una hora exacta de entrega.</p>
   <h3>Envíos nacionales</h3><p>Realizamos despachos a ciudades y municipios de Colombia. Los tiempos pueden variar según destino, transportadora y generación de la guía. En ciudades principales la entrega puede realizarse desde 1 día hábil después de generada la guía.</p>`},
  pagos:{
   title:'Medios de pago',
   html:`<p><strong>⚡ Llave Bre-B</strong> · <strong>💳 Tarjeta de crédito:</strong> solicita tu link de pago Bold. <strong>El pago con tarjeta tiene un valor adicional correspondiente a la comisión cobrada por la pasarela Bold.</strong> · <strong>🏪 Corresponsal bancario:</strong> confirma primero con nosotros el número de cuenta.</p>
   <p>⚠️ No nos hacemos responsables por pagos enviados a cuentas o números no suministrados oficialmente para tu pedido.</p>
   <p><strong>No manejamos Addi ni Sistecrédito.</strong></p>`},
  cambios:{
   title:'Cambios y devoluciones',
   html:`<p>Si recibes un producto incorrecto, con daño visible o con una novedad atribuible al despacho, comunícate con nosotros lo antes posible por WhatsApp y conserva el producto, empaque y evidencia de la novedad.</p>
   <p>Las solicitudes de cambio o devolución se revisan según el estado del producto, la naturaleza de la novedad y las condiciones aplicables a la compra. Por razones de seguridad e integridad, los productos abiertos, usados o manipulados pueden estar sujetos a restricciones de cambio.</p>
   <p>Esta información no limita los derechos que correspondan al consumidor conforme a la legislación aplicable.</p>`},
  privacidad:{
   title:'Privacidad y datos',
   html:`<p>Los datos que el cliente proporciona durante una consulta o pedido se utilizan para gestionar la compra, coordinar el despacho, prestar atención relacionada con el pedido y mantener la comunicación necesaria para el servicio.</p>
   <p>No publicamos datos personales del cliente en el catálogo. Evita enviar contraseñas, claves bancarias u otra información que no sea necesaria para procesar tu pedido.</p>
   <p>Cuando el pedido continúa mediante WhatsApp o un proveedor de pagos, también pueden aplicar las políticas de privacidad de dichos servicios.</p>`},
  cookies:{
   title:'Cookies y almacenamiento local',
   html:`<p>Este catálogo puede utilizar almacenamiento local del navegador y tecnologías similares para recordar productos del carrito, preferencias y facilitar la navegación.</p>
   <p>Estas funciones permiten, por ejemplo, conservar temporalmente el contenido del carrito mientras recorres el catálogo.</p>
   <p>Si en el futuro se incorporan herramientas de analítica, publicidad o seguimiento que utilicen cookies no esenciales, esta información deberá actualizarse y se implementarán los controles de consentimiento que correspondan.</p>`},
  terminos:{
   title:'Términos y condiciones',
   html:`<p>La disponibilidad, presentación, sabor y precio de los productos pueden cambiar. La disponibilidad definitiva se confirma al momento de gestionar el pedido.</p>
   <p>Las imágenes son de referencia y pueden existir cambios de presentación realizados por el fabricante. Los tiempos de transporte son estimados y pueden variar por destino, transportadora u otras circunstancias logísticas.</p>
   <p>Antes de confirmar el pedido, el cliente puede revisar productos, cantidades, forma de pago, datos de entrega y costos aplicables.</p>
   <p>La información del catálogo es comercial e informativa y no sustituye asesoría médica profesional.</p>`}
 };
 const modal=document.getElementById('liftLegalModal'), title=document.getElementById('liftLegalTitle'), body=document.getElementById('liftLegalBody');
 if(!modal) return;
 function openLegal(key){
   const d=DATA[key]; if(!d)return;
   title.textContent=d.title; body.innerHTML=d.html;
   modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false');
   document.body.style.overflow='hidden';
 }
 function closeLegal(){
   modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true');
   document.body.style.overflow='';
 }
 document.addEventListener('click',e=>{
   const b=e.target.closest('[data-lift-legal]');
   if(b) openLegal(b.dataset.liftLegal);
   if(e.target.closest('[data-lift-legal-close]')) closeLegal();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLegal()});
})();

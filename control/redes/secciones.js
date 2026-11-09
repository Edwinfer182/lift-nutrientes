/* SUPGO · Estudio de redes: secciones heredadas del "Instagram SEO" clásico
   (Educación · Calendario, TikTok · Guiones y Marcas · SEO), unificadas aquí. */
(function(){
'use strict';
const R=()=>window.SupgoRedes;
const el=(tag,attrs,...kids)=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs||{})){if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k.startsWith('on'))e[k]=v;else e.setAttribute(k,v)}kids.flat().forEach(k=>k!=null&&e.append(k));return e};
const selectEl=(label,options,value)=>{const s=el('select');options.forEach(([v,t])=>s.add(new Option(t,v)));if(value!=null)s.value=value;return [el('label',{},label,s),s]};
const block=(label,ta,extra)=>el('div',{class:'block'},el('header',{},el('b',{text:label}),el('span',{class:'row'},...(extra||[]),el('button',{class:'btn',text:'Copiar',onclick:()=>R().copy(ta.value)}))),ta);
const area=rows=>{const t=el('textarea');t.rows=rows;return t};
const rendered={};

/* ================= Educación · Calendario ================= */
const TYPES=[['Educativo','Explica un concepto con lenguaje claro, una sola idea útil y datos verificables.'],['Mitos y realidades','Contrasta un mito frecuente con una explicación rigurosa y sin exageraciones.'],['Comparación','Compara dos opciones mediante criterios prácticos y sin declarar ganadores universales.'],['Errores comunes','Presenta un error frecuente, por qué importa y una alternativa razonable.'],['Preguntas frecuentes','Responde una pregunta concreta de forma sencilla y precisa.'],['Consejo práctico','Ofrece un consejo aplicable con pasos breves y prudentes.'],['Disciplina y motivación','Usa un mensaje breve de constancia y entrenamiento sin prometer resultados.'],['Interacción','Plantea una pregunta o encuesta breve para generar respuestas.'],['Producto protagonista','Presenta el producto seleccionado, sin inventar propiedades ni mostrar precio salvo que se solicite.'],['Guía de compra','Explica criterios para elegir una opción según necesidades personales.'],['Dato curioso','Presenta un dato sorprendente y verificable con contexto.'],['Verdadero o falso','Plantea una afirmación y aclara su validez.'],['Paso a paso','Explica un proceso simple en tres pasos.'],['Checklist','Ofrece una lista breve de verificación.'],['Antes y después de aprender','Contrasta una creencia inicial con una explicación fundamentada.'],['Glosario fitness','Define un término técnico en lenguaje cotidiano.'],['Caso hipotético','Ilustra una situación cotidiana sin inventar testimonios.'],['Reto semanal','Propón un reto de hábitos realista y seguro.'],['Encuesta','Invita a elegir entre dos opciones sin sesgar la respuesta.'],['Carrusel educativo','Organiza el contenido en varias láminas breves.'],['Mini guía','Resume los puntos clave para principiantes.'],['Lo que dice la evidencia','Distingue evidencia científica de publicidad sin inventar estudios.'],['Señales para revisar','Enumera criterios útiles sin diagnosticar.'],['Hábitos de entrenamiento','Propón hábitos sostenibles para entrenar.'],['Preguntas para tu entrenador','Sugiere preguntas prácticas para consultar a un profesional.']];
const THEMES=['Creatina','Proteína whey','Proteína aislada vs concentrada','Preentrenos','EAA y BCAA','Hidratación','Recuperación y descanso','Lectura de etiquetas','Sabores y presentaciones','Entrenar solo','Constancia en el gimnasio','Nutrición deportiva','Errores de principiantes','Suplementos y alimentación','Preguntas de la comunidad','Creatina monohidratada','Creatina y horarios','Creatina y retención de agua','Proteína por porción','Whey vs alimentos','Proteína vegetal','Ganadores de masa','Cafeína y entrenamiento','Preentreno y sueño','Beta alanina','Citrulina','Electrolitos','Omega 3','Magnesio','Multivitamínicos','Colágeno','Enzimas digestivas','Probióticos','Carbohidratos y rendimiento','Déficit calórico','Superávit calórico','Progresión de cargas','Técnica de ejercicios','Calentamiento','Entrenamiento de fuerza','Hipertrofia','Entrenar en casa','Rutina de piernas','Rutina de espalda','Hombros','Bíceps y tríceps','Pantorrillas','Frecuencia de entrenamiento','Descanso entre series','Sueño y rendimiento','Motivación vs disciplina','Cómo empezar en el gimnasio','Cómo comparar precios por porción','Registro sanitario y etiquetas','Almacenamiento de suplementos','Suplementos para principiantes','Suplementos y expectativas realistas'];
const HOOKS_EDU={'Educativo':s=>'Lo esencial sobre '+s+' 📚','Mitos y realidades':s=>'¿Mito o realidad? Hablemos de '+s+' 🔎','Comparación':s=>'Antes de comparar opciones de '+s+', lee esto 👇','Errores comunes':s=>'Un error común al hablar de '+s+' ⚠️','Preguntas frecuentes':s=>'Resolvamos dudas sobre '+s+' 💬','Consejo práctico':s=>'Un consejo práctico sobre '+s+' 💡','Disciplina y motivación':s=>'La constancia se entrena. Hoy hablamos de '+s+' 💪','Interacción':s=>'Queremos conocer tu opinión sobre '+s+' 👇','Producto protagonista':s=>'Antes de elegir un producto relacionado con '+s+' 🔍','Guía de compra':s=>'Guía rápida para entender '+s+' 🛒','Dato curioso':s=>'Un dato interesante sobre '+s+' 🧠','Verdadero o falso':s=>'¿Verdadero o falso? '+s+' 🤔','Paso a paso':s=>'Tres pasos para entender '+s+' 📌','Checklist':s=>'Lista rápida para revisar '+s+' ✅','Antes y después de aprender':s=>'Lo que muchos creen sobre '+s+' y lo que conviene saber.','Glosario fitness':s=>'Diccionario fitness: '+s+' 📖','Caso hipotético':s=>'Imagina que estás aprendiendo sobre '+s+'...','Reto semanal':s=>'Reto de la semana: aprende algo nuevo sobre '+s+' 💪','Encuesta':s=>'Encuesta rápida: '+s+' 📊','Carrusel educativo':s=>'Desliza para entender mejor '+s+' 👉','Mini guía':s=>'Mini guía: '+s+' 📋','Lo que dice la evidencia':s=>'¿Qué sabemos realmente sobre '+s+'? 🔬','Señales para revisar':s=>'Antes de decidir sobre '+s+', revisa esto.','Hábitos de entrenamiento':s=>'Pequeños hábitos, mejores rutinas: '+s,'Preguntas para tu entrenador':s=>'Preguntas que vale la pena hacer sobre '+s+' 💬'};
function facts(subject){
 if(/creatina/i.test(subject))return ['La creatina ayuda a mejorar el rendimiento en esfuerzos cortos y de alta intensidad. La constancia importa más que una hora específica de consumo.','No confundas cambios de agua dentro del músculo con un aumento inmediato de grasa.','¿La tomas a diario o solo cuando entrenas?'];
 if(/proteína|whey|aislada|masa|ganador/i.test(subject))return ['La proteína contribuye al mantenimiento y crecimiento de la masa muscular junto con entrenamiento y alimentación adecuados. Un batido es una opción práctica, no una obligación.','Compara la proteína por porción, los ingredientes y tus necesidades antes de elegir.','¿Prefieres cubrir tus necesidades con alimentos, batidos o ambos?'];
 if(/preentreno|cafeína|beta alanina|citrulina/i.test(subject))return ['Los ingredientes de un preentreno no cumplen todos la misma función. La cafeína puede mejorar el estado de alerta, pero también afectar el sueño.','Revisa ingredientes y cantidades; más estimulante no significa necesariamente mejor entrenamiento.','¿Revisas la cafeína antes de elegir un preentreno?'];
 if(/eaa|bcaa|aminoácid/i.test(subject))return ['Los aminoácidos esenciales participan en la síntesis de proteínas. La utilidad de suplementarlos depende, entre otras cosas, de la proteína total de tu alimentación.','Antes de añadir otro suplemento, revisa si tu dieta ya cubre tus necesidades.','¿Conoces la diferencia entre EAA y BCAA?'];
 if(/sueño|descanso|recuperación/i.test(subject))return ['El descanso forma parte del entrenamiento. Dormir bien y gestionar la carga ayudan a recuperarte entre sesiones.','No confundas entrenar más días con progresar necesariamente más.','¿Cuántas horas sueles dormir?'];
 if(/entren|fuerza|hipertrofia|piernas|espalda|hombros|bíceps|tríceps|pantorrillas|series|cargas|técnica|calentamiento|gimnasio/i.test(subject))return ['Progresar en el gimnasio depende de una técnica adecuada, una carga que puedas controlar y una rutina sostenible.','Registra tu entrenamiento y mejora gradualmente, sin sacrificar la ejecución.','¿Qué parte de tu rutina te cuesta más mejorar?'];
 if(/disciplina|constancia|motivación|solo/i.test(subject))return ['La disciplina se construye repitiendo hábitos realistas, incluso cuando no hay motivación.','Una sesión consistente vale más que un plan perfecto que nunca se cumple.','¿Qué hábito te ayuda a no abandonar?'];
 if(/etiqueta|registro|precio|porción|almacenamiento|sabores|presentaciones|comparar/i.test(subject))return ['Leer la etiqueta permite comparar ingredientes, cantidades por porción, presentación y recomendaciones del fabricante.','No elijas solo por el tamaño del envase o por una frase llamativa del empaque.','¿Qué revisas primero antes de comprar?'];
 if(/hidratación|electrolito/i.test(subject))return ['Las necesidades de líquidos varían según la actividad, el clima y la sudoración. No todas las sesiones requieren bebidas con electrolitos.','Considera la duración e intensidad del ejercicio y tus condiciones individuales.','¿Llevas agua a todos tus entrenamientos?'];
 if(/carbohidrato|déficit|superávit|nutrición|alimentación/i.test(subject))return ['La alimentación y la energía disponible influyen en el rendimiento y la recuperación. No existe una estrategia idéntica para todas las personas.','Ajusta tus decisiones a tus objetivos y evita las reglas extremas.','¿Qué parte de tu alimentación te gustaría entender mejor?'];
 return ['Comprender para qué sirve cada opción y en qué contexto puede ser útil ayuda a tomar decisiones más informadas.','Revisa la evidencia, las indicaciones del fabricante y tus necesidades antes de cambiar hábitos.','¿Qué duda tienes sobre este tema?'];
}
function renderEducacion(box){
 const [lt,type]=selectEl('Tipo de contenido',TYPES.map((t,i)=>[i,t[0]]));
 const [lth,theme]=selectEl('Tema',THEMES.map((t,i)=>[i,t]));
 const custom=el('input',{type:'text',placeholder:'O escribe otro tema…'});
 const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
 const [ld,day]=selectEl('Día',days.map((d,i)=>[i,d]),String((new Date().getDay()+6)%7));
 const [lm,moment]=selectEl('Momento',[['mañana','Mañana · post 4:5'],['tarde','Tarde · post 4:5'],['noche','Noche · historia 9:16']]);
 // Producto opcional para "Producto protagonista"
 const prodIn=el('input',{type:'text',placeholder:'Producto (opcional): escribe para buscar',list:'edu-prods'});
 const dl=el('datalist',{id:'edu-prods'});R().rows().slice(0,1500).forEach(x=>dl.append(el('option',{value:x.name+(x.brand?' · '+x.brand:'')})));
 const caption=area(9),prompt=area(7),slots=el('div',{class:'slots'});
 const subject=()=>custom.value.trim()||THEMES[Number(theme.value)];
 function update(){
  const t=TYPES[Number(type.value)],s=subject(),low=s.toLowerCase(),[fact,tip,question]=facts(s);
  const intro=(HOOKS_EDU[t[0]]||(x=>'Aprendamos sobre '+x))(low);
  const middle=/Errores|Checklist|Guía|Paso a paso|Señales|compra/i.test(t[0])?tip+'\n\n'+fact:fact+'\n\n'+tip;
  const closing=/Interacción|Encuesta|Preguntas/i.test(t[0])?question+' Cuéntanos en comentarios. 👇':question;
  const tags=/entren|gimnasio|disciplina|fuerza|hipertrofia|series/i.test(s)?'#Entrenamiento #DisciplinaFitness #Gimnasio #SUPGO':'#NutricionDeportiva #Suplementos #EducacionFitness #SUPGO';
  caption.value=intro+'\n\n'+middle+'\n\n'+closing+'\n\n'+tags;
  const showProduct=t[0]==='Producto protagonista'&&prodIn.value.trim();
  prompt.value='@Estados: Crea una imagen para '+(moment.value==='noche'?'historia de Instagram o estado de WhatsApp, formato 9:16 (1080 × 1920 px)':'publicación de Instagram, formato 4:5 (1080 × 1350 px)')+'. Tipo de contenido: '+t[0]+'. Tema: '+s+'. Enfoque: '+t[1]+' '+(showProduct?'Usa la fotografía original del producto '+prodIn.value.trim()+'; respeta fielmente envase, marca, etiqueta y sabor. ':'No fuerces la inclusión del producto; prioriza el tema. ')+'Utiliza la programación y estilo visual que ya tenemos definidos. Una sola idea principal, composición limpia, gancho breve y poco texto. No inventes datos, testimonios, afirmaciones nutricionales ni logos. No incluyas precios salvo que se soliciten. Entrega una sola imagen lista para publicar.';
 }
 function renderSlots(){slots.replaceChildren();const d=Number(day.value);
  [[d%TYPES.length,(d*2)%THEMES.length,'mañana'],[(d+8)%TYPES.length,(d*2+4)%THEMES.length,'tarde'],[(d+7)%TYPES.length,(d*2+8)%THEMES.length,'noche']].forEach(([ti,th,p])=>{
   slots.append(el('div',{},el('span',{text:(p==='mañana'?'🌅 Mañana':p==='tarde'?'☀️ Tarde':'🌙 Noche')+' · '+TYPES[ti][0]+' / '+THEMES[th]}),el('button',{class:'btn',text:'Usar',onclick:()=>{type.value=String(ti);theme.value=String(th);custom.value='';moment.value=p;update()}})))})}
 [type,moment].forEach(x=>x.onchange=update);theme.onchange=()=>{custom.value='';update()};custom.oninput=update;prodIn.oninput=update;day.onchange=renderSlots;
 box.append(el('div',{class:'card'},
  el('h2',{text:'Planificador creativo · Educación'}),el('div',{class:'muted',text:'Combina tipo de contenido y tema. Obtienes el texto para Instagram y el prompt para @Estados.'}),
  el('div',{class:'grid2',style:'margin-top:10px'},lt,lth,el('label',{},'Tema propio',custom),ld,lm,el('label',{},'Producto protagonista',prodIn,dl)),
  el('div',{class:'row',style:'margin-top:10px'},el('button',{class:'btn dark',text:'↻ Variar combinación',onclick:()=>{type.selectedIndex=(type.selectedIndex+3)%TYPES.length;theme.selectedIndex=(theme.selectedIndex+5)%THEMES.length;custom.value='';update()}})),
  el('div',{class:'txt',style:'margin-top:12px'},block('Copy para Instagram',caption),block('Prompt para @Estados',prompt)),
  el('h2',{text:'Ideas para el día',style:'margin-top:16px'}),slots));
 renderSlots();update();
}

/* ================= TikTok · Guiones ================= */
const TOPICS=['NAC','Creatina monohidratada','Creatina HCL','Creapure','Proteína whey','Proteína aislada','Proteína hidrolizada','Proteína vegetal','Caseína','Mass gainer','Preentrenos','Café y preentreno','Preentreno sin cafeína','Cafeína','Citrulina','Beta alanina','BCAA','EAA','Glutamina','Electrolitos','Omega 3','Magnesio glicinato','Magnesio citrato','ZMA','Multivitamínicos','Vitamina D','Zinc','Colágeno','Glucosamina y condroitina','Probióticos','Enzimas digestivas','Ashwagandha','Coenzima Q10','Curcumina','Inositol','Suplementos para principiantes','Cómo leer etiquetas','Suplementos originales','Cuándo tomar suplementos','Suplementos y descanso'];
const HOOKS=[['¿Vale la pena X?','¿Vale la pena {x}?'],['Antes de comprar X','Antes de comprar {x}, escucha esto.'],['No hagas X sin revisar','No compres {x} sin revisar lo que contiene.'],['3 errores con X','3 errores que debes evitar con {x}.'],['¿Necesitas X?','¿Realmente necesitas {x}?'],['Lo que nadie explica','Lo que casi nadie te explica sobre {x}.'],['El error más común','Este es un error frecuente con {x}.'],['¿Qué dice la evidencia?','¿Qué dice realmente la evidencia sobre {x}?'],['No compres X todavía','No compres {x} todavía sin revisar la etiqueta.'],['El mito de X','Hay un mito sobre {x} que necesitas entender.'],['¿Qué revisar primero?','¿Qué deberías revisar primero en {x}?'],['El precio no lo es todo','¿Pagar más por {x} significa comprar mejor?'],['Te están confundiendo','¿Te están confundiendo con {x}?'],['Deja de hacer esto','Deja de elegir {x} sin revisar la etiqueta.'],['¿Sabes qué compras?','¿Tú sí sabes qué estás comprando cuando eliges {x}?'],['Antes de gastar','Antes de gastar en {x}, revisa esto.'],['No te dejes llevar','No te dejes llevar por la publicidad de {x}.'],['¿Lo estás usando bien?','¿Estás evaluando correctamente {x}?'],['El detalle olvidado','Este detalle de {x} merece tu atención.'],['Si empiezas de cero','Si vas a empezar con {x}, ten esto presente.'],['No confundas las cosas','No confundas {x} con una solución para todo.'],['La pregunta incómoda','¿Para qué necesitas realmente {x}?'],['Mira la etiqueta','¿Ya revisaste la etiqueta de {x}?'],['Lo que haría diferente','Si comprara {x}, revisaría esto primero.'],['¿Es indispensable?','¿Es indispensable {x} para tus objetivos?'],['Cuidado con el marketing','¿Estás eligiendo {x} por evidencia o por publicidad?'],['No te compliques','No te compliques con {x} sin entender lo básico.'],['Una cosa es comprar','Una cosa es comprar {x} y otra saber para qué sirve.'],['Te falta revisar esto','Si estás pensando en {x}, te falta revisar esto.'],['Hablemos claro','Hablemos claro sobre {x}.']];
function renderTiktok(box){
 const [lt,topic]=selectEl('Tema',TOPICS.map((t,i)=>[i,t]));
 const custom=el('input',{type:'text',placeholder:'O escribe otro tema…'});
 const [lh,hook]=selectEl('Gancho',HOOKS.map((h,i)=>[i,(i+1)+'. '+h[0]]));
 const [ld,duration]=selectEl('Duración',[['30','30 segundos'],['45','45 segundos'],['60','60 segundos']],'60');
 const [lp,tone]=selectEl('Personalidad',[['charro','Confrontativo y charro'],['fuerte','Más confrontativo'],['natural','Directo y natural']]);
 const [le,engagement]=selectEl('Interacción',[['comentarios','Pedir comentarios'],['guardar','Invitar a guardar'],['seguir','Invitar a seguir']]);
 const [lc,commercial]=selectEl('Cierre comercial',[['interno','Escríbeme al interno'],['whatsapp','Escríbeme por WhatsApp'],['perfil','Enlace en mi perfil'],['asesoria','Asesoría por mensaje']]);
 const sales=area(2);sales.value='Y si deseas adquirir suplementos, háblame al interno y te asesoro.';
 const extra=area(2);extra.placeholder='Ej.: menciona un error común o compara ingredientes…';
 const hookBox=el('div',{class:'hookbox'}),prompt=area(14);
 function update(){
  const subject=custom.value.trim()||TOPICS[Number(topic.value)],selected=HOOKS[Number(hook.value)][1].replace(/\{x\}/g,subject.toLowerCase());
  hookBox.textContent='Gancho obligatorio: '+selected;sales.disabled=commercial.value!=='interno';
  const phrase=commercial.value==='interno'?sales.value:commercial.value==='whatsapp'?'Si deseas adquirir suplementos, escríbeme por WhatsApp y te asesoro.':commercial.value==='perfil'?'Si deseas consultar suplementos, revisa el enlace de mi perfil.':'Si necesitas orientación para adquirir suplementos, escríbeme por mensaje privado.';
  const n=duration.value==='60'?'12 a 16':duration.value==='45'?'9 a 12':'6 a 8';
  prompt.value=['Actúa como guionista de TikTok especializado en suplementos deportivos, fitness y educación nutricional.','TEMA: '+subject,'GANCHO SELECCIONADO (OBLIGATORIO): "'+selected+'"','Comienza el guion con ese gancho EXACTAMENTE como está escrito, sin reformularlo ni añadir palabras antes.','PALABRAS CLAVE SEO: '+subject+', suplemento, suplementos deportivos, para qué sirve '+subject+'.',
   'CONTEXTO SEO OBLIGATORIO: el video siempre trata sobre SUPLEMENTOS. Menciona de forma audible la palabra exacta «suplemento» al menos una vez dentro de la explicación del GUION HABLADO, no solo en el título, el copy, hashtags o CTA. Si el tema es genérico como etiquetas, explica desde la primera parte que hablas de etiquetas de suplementos; usa expresiones naturales como «etiqueta de un suplemento» o «cuando compras un suplemento». No fuerces repeticiones ni cambies el gancho literal. También incluye «suplemento» naturalmente en el COPY PARA TIKTOK.',
   'DURACIÓN: aproximadamente '+duration.value+' segundos.','PERSONALIDAD: '+(tone.value==='charro'?'confrontativa y charra con humor colombiano':tone.value==='fuerte'?'muy confrontativa, provocadora y charra':'directa, natural y ligeramente sarcástica')+'.',
   'VOZ: habla siempre de TÚ A TÚ a UNA sola persona como si la tuvieras enfrente. Usa tú, te, tu, haces, compras, revisaste. No uses expresiones colectivas como mucha gente, las personas, todos, hay quienes o la mayoría. No narres desde afuera lo que otros hacen.',
   'HUMOR: confronta las decisiones con expresiones charras y naturales como NPC del gym, desalentado, parcero, prime o aura, únicamente cuando encajen. Sé gracioso y confrontativo sin insultar ni humillar. No inventes que el espectador hizo algo; usa preguntas directas cuando corresponda. Evita explicar extensamente el comportamiento: señala el error con una frase charra y pasa al argumento concreto.',
   'PROHIBIDOS: remates vacíos como por arte de magia, no es magia, no hace milagros, fórmula mágica, y listo, así de fácil, eso es todo. Ninguna idea debe acabar en relleno, motivación vacía ni frases robóticas. Termina con un dato, una consecuencia, una pregunta concreta o una recomendación.',
   'ESTRUCTURA EN CUATRO PARTES: 1) gancho literal y crítica graciosa al error; 2) problema y argumentación clara, con evidencia prudente; 3) solución útil y concreta; 4) doble llamado a la acción.',
   'DOBLE CTA: primero '+(engagement.value==='comentarios'?'haz una pregunta concreta que invite a comentar':engagement.value==='guardar'?'invita a guardar el video':'invita a seguir la cuenta')+'. Después añade naturalmente la invitación comercial: "'+phrase+'". Reserva tiempo para ambos dentro de la duración total, sin sonar como vendedor agresivo.',
   'RITMO DE GRABACIÓN: UNA SOLA IDEA POR BLOQUE. Cada bloque puede ocupar UNO O DOS RENGLONES como máximo; si son dos, deben desarrollar la misma idea continua. Cada bloque se debe poder pronunciar en aproximadamente 3 a 5 segundos. Separa cada bloque con una línea en blanco. Usa aproximadamente '+n+' bloques, sin marcas de tiempo ni instrucciones de edición. No dividas artificialmente las frases ni alargues una idea durante cinco líneas.',
   'Usa 2 o 3 frases SEO de manera natural. No inventes estudios, beneficios, resultados garantizados ni afirmaciones médicas. El CTA comercial no debe prometer efectos.',
   extra.value.trim()?'INDICACIÓN ADICIONAL: '+extra.value.trim():'',
   'IMÁGENES DE APOYO PARA CAPCUT: después del guion y del copy, escribe EXACTAMENTE CUATRO PROMPTS INDEPENDIENTES para generar imágenes relacionadas directamente con el tema '+subject+'. Deben corresponder a cuatro momentos diferentes del guion: 1) gancho o presentación del suplemento, 2) error o problema, 3) explicación visual concreta, 4) solución o recomendación. Cada prompt debe ser completo y autónomo para copiarlo por separado en otra IA generadora de imágenes. Solicita PNG con FONDO TRANSPARENTE REAL (canal alfa), objeto aislado, sin escenario ni fondo blanco, sin texto superpuesto, sin marcas ni logos inventados, sin datos nutricionales falsos. Estilo fotorrealista, iluminación profesional, composición clara y objetos completos, adecuados para superponer en videos verticales de CapCut. Los cuatro deben ser visualmente diferentes y mostrar objetos o conceptos pertinentes al tema, no cuatro tarros repetidos. Si el tema es etiquetas, muestra específicamente etiquetas de SUPLEMENTOS. No incluyas personas a menos que sea esencial. No generes imágenes: entrega solo los prompts de texto.',
   'ENTREGA SOLO ESTAS SECCIONES Y EN ESTE ORDEN: GUION PARA TIKTOK (cuatro partes narrativas en bloques breves, sin subtítulos intermedios); COPY PARA TIKTOK (SEO, pregunta, invitación discreta al interno y 3 a 5 hashtags); PALABRAS CLAVE (tres frases); CUATRO PROMPTS DE IMÁGENES DE APOYO (Imagen 1, Imagen 2, Imagen 3, Imagen 4, cada uno separado y listo para copiar en otra IA).',
   'Verifica antes de entregar: gancho idéntico, segunda persona singular, humor confrontativo y charro, máximo dos renglones por bloque, sin remates vacíos y dos CTA.'].filter(Boolean).join('\n\n');
 }
 [topic,hook,duration,tone,engagement,commercial].forEach(x=>x.onchange=update);[sales,extra,custom].forEach(x=>x.oninput=update);
 box.append(el('div',{class:'card'},
  el('h2',{text:'Generador de guiones · TikTok'}),el('div',{class:'muted',text:'Guiones de tú a tú: confrontativos, charros, educativos y con doble llamado a la acción. Copia el prompt y pégalo en ChatGPT.'}),
  el('div',{class:'grid2',style:'margin-top:10px'},lt,el('label',{},'Tema propio',custom),lh,ld,lp,le,lc),
  hookBox,el('div',{class:'grid2'},el('label',{},'Frase comercial editable',sales),el('label',{},'Indicaciones adicionales',extra)),
  el('div',{class:'txt',style:'margin-top:12px'},block('Prompt listo para copiar',prompt,[el('button',{class:'btn',text:'Otro gancho',onclick:()=>{hook.selectedIndex=(hook.selectedIndex+1)%HOOKS.length;update()}}),el('button',{class:'btn lime',text:'Abrir ChatGPT',onclick:()=>window.open('https://chatgpt.com/','_blank','noopener')})])),
  el('div',{class:'muted',style:'margin-top:8px',text:'Ritmo: una idea por bloque, máximo dos renglones, 3 a 5 segundos por bloque.'})));
 update();
}

/* ================= Marcas · SEO ================= */
function renderMarcas(box){
 const rows=R().rows(),brands=[...new Set(rows.map(x=>x.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
 const [lb,brand]=selectEl('Marca',[['','Selecciona una marca'],...brands.map(b=>[b,b+' ('+rows.filter(x=>x.brand===b).length+')'])]);
 const list=el('div',{class:'urls'}),prompt=area(16),info=el('div',{class:'muted'});
 const actions=el('div',{class:'row',style:'margin-top:8px'});
 function update(){
  const b=brand.value;list.replaceChildren();actions.replaceChildren();
  if(!b){prompt.value='Selecciona una marca para ver sus fichas y preparar la orden de optimización.';info.textContent='';return}
  const items=rows.filter(x=>x.brand===b).sort((x,y)=>x.name.localeCompare(y.name,'es'));
  info.textContent=items.length+' fichas públicas de '+b+'. Página de la marca: https://supgo.co/laboratorios/'+R().slug(b)+'/';
  const label=x=>x.name+(x.flavor&&!R().norm(x.name).includes(R().norm(x.flavor))?' · '+x.flavor:'');
  items.forEach(x=>list.append(el('div',{},el('a',{href:x.url,target:'_blank',rel:'noopener',text:label(x)+' — '+x.url}),el('button',{class:'btn',text:'Copiar enlace',onclick:()=>R().copy(x.url)}))));
  actions.append(el('button',{class:'btn dark',text:'Copiar todos los enlaces',onclick:()=>R().copy(items.map(x=>x.url).join('\n'))}),
   el('a',{class:'btn',href:'https://search.google.com/search-console',target:'_blank',rel:'noopener',text:'Abrir Google Search Console'}),
   el('a',{class:'btn',href:'/editor/',target:'_blank',rel:'noopener',text:'Abrir editor SEO'}));
  prompt.value=`Actúa como especialista en SEO técnico y posicionamiento local para SUPGO (https://supgo.co).

MARCA: ${b}
OBJETIVO: optimizar la FICHA INDIVIDUAL de cada uno de los ${items.length} productos de ${b} listados abajo. La marca solo sirve de filtro: no te limites a la página general de la marca.

CÓMO FUNCIONA HOY EL SEO DE SUPGO (no lo cambies):
- Las fichas son dinámicas: https://supgo.co/producto/<slug>/ se genera en cada visita (api/producto.js en el repositorio Edwinfer182/lift-nutrientes, rama main) leyendo Supabase. No hay páginas estáticas ni workflows que regenerar; las URLs antiguas /productos/…html ya no existen.
- Los textos viven en Supabase, tabla lift_producto_seo (producto_id, titulo_seo, meta_descripcion, descripcion_larga_html, canonical_url = https://supgo.co/producto/<slug>/, indexable, palabra_clave).
- El panel guarda lo mismo en lift_productos.product->'seo' (title, meta, html) y el disparador lift_sync_producto_seo_on_save lo copia a lift_producto_seo en cada guardado. Actualiza los dos lugares (o primero product->'seo') para que un guardado posterior del panel no borre tu trabajo.
- Si un texto guardado es genérico o describe otro producto, la ficha lo ignora y genera uno automático con los datos (api/_seo-producto.js). Por eso tu texto debe nombrar el producto exacto, su sabor y presentación.

PARA CADA PRODUCTO:
1. Título SEO (máx. ~60 caracteres) con nombre, presentación/sabor y marca; meta descripción (máx. ~155) con un dato concreto (tamaño, servicios o precio) y «envíos a toda Colombia».
2. Descripción larga HTML original y específica de esa presentación: qué es, para quién, cómo se compara con otras presentaciones de la marca y qué revisar en la etiqueta. Nada de plantillas repetidas.
3. Exactamente 4 enlaces internos reales y relevantes dentro de la descripción (otra presentación o sabor, su categoría /categorias/<slug>/, la página de la marca /laboratorios/${R().slug(b)}/ y una guía /guias/… que exista).
4. Enfoque local en Medellín y, cuando sea natural, Bogotá, Cali, Barranquilla, Cartagena, Bucaramanga y Pereira, sin repetir palabras clave de forma artificial.
5. No inventes precios, disponibilidad, registros sanitarios, estudios, resultados ni afirmaciones médicas.

VERIFICACIÓN Y ENTREGA:
- Abre cada URL publicada y confirma que el título, la meta y la descripción nuevos aparecen (puede tardar hasta 5 minutos por la caché).
- Entrega la lista COMPLETA: nombre, ID, URL y estado (actualizado y verificado / fallido con motivo). Termina con el total encontrado, actualizado, verificado y fallido. No resumas con «y otros».

FICHAS DE ${b.toUpperCase()}:
${items.map(x=>'- ID '+x.id+' · '+x.name+(x.flavor?' · sabor '+x.flavor:'')+' · '+x.url).join('\n')}`;
 }
 brand.onchange=update;
 box.append(el('div',{class:'card'},
  el('h2',{text:'SEO de productos por marca'}),el('div',{class:'muted',text:'Elige una marca: ves todas sus fichas con enlace para Search Console y una orden actualizada para optimizarlas con otra IA.'}),
  el('div',{class:'grid2',style:'margin-top:10px'},lb),info,list,actions,
  el('div',{class:'txt',style:'margin-top:12px'},block('Orden lista para copiar',prompt))));
 update();
}

/* ================= Instagram en Google ================= */
function renderGoogle(box){
 const r=R(),rows=r.rows(),city=r.CITY;
 const card=(title,sub,...kids)=>el('div',{class:'card',style:'margin-bottom:12px'},el('h2',{text:title}),sub?el('div',{class:'muted',text:sub}):null,...kids);
 // 1. Revisión de la cuenta
 const checks=[
  ['Cuenta profesional (Empresa o Creador) y pública','Solo las publicaciones públicas de cuentas profesionales de mayores de 18 años aparecen en Google.'],
  ['Indexación activada','Configuración → Privacidad de la cuenta → "Permitir que las fotos y videos públicos aparezcan en los resultados de búsqueda". Viene activada; confirma que no la hayas apagado.'],
  ['Nombre del perfil con lo que vendes','El campo "Nombre" (no el usuario) es lo que Google muestra como título. Usa una de las opciones de abajo.'],
  ['Bio con ciudad y categoría','Di qué vendes y dónde, en palabras que la gente busca.'],
  ['Enlace de la bio a supgo.co con seguimiento','Así ves en Analytics cuántas visitas y ventas llegan desde Instagram.'],
  ['Categoría y dirección del negocio','Elige "Tienda de suplementos" o similar y pon '+city+' como ciudad.'],
  ['Historias destacadas: no cuentan','Las historias y destacadas no aparecen en Google. Lo que posiciona son posts, carruseles y reels.']];
 const KEY='supgo-ig-google-checks';let done={};try{done=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
 const list=el('div',{style:'display:grid;gap:8px;margin-top:10px'},...checks.map(([t,d],i)=>{const cb=el('input',{type:'checkbox'});cb.checked=!!done[i];cb.onchange=()=>{done[i]=cb.checked;try{localStorage.setItem(KEY,JSON.stringify(done))}catch(e){}};
  return el('label',{style:'display:flex;gap:10px;align-items:flex-start;padding:10px;border:1px solid #e5e7eb;border-radius:12px;cursor:pointer'},cb,el('span',{},el('b',{text:t}),el('div',{class:'muted',text:d})))}));
 box.append(card('1 · Revisa tu cuenta','Desde julio de 2025 Google muestra publicaciones de Instagram en sus resultados. Marca lo que ya tengas listo.',list));
 // 2. Nombre y bio
 const names=['SUPGO · Suplementos '+city,'SUPGO Suplementos '+city,'SUPGO | Tienda de suplementos'].filter(n=>n.length<=30);
 const bios=['Tienda de suplementos en '+city+' 💪 Proteína, creatina, pre-entreno y más.\nEnvíos a toda Colombia 🚚\n👇 Compra aquí',
  'Suplementos deportivos en '+city+' · Proteína, creatina, vitaminas.\nEntregas rápidas en '+city+' · Envíos a Colombia\n👇 supgo.co',
  '💪 Suplementos en '+city+' y toda Colombia\nAsesoría por WhatsApp · Pagos seguros\n👇 Pide aquí'];
 const link='https://supgo.co/?utm_source=instagram&utm_medium=bio&utm_campaign=perfil';
 const opts=(arr,lim)=>el('div',{style:'display:grid;gap:8px;margin-top:8px'},...arr.map(t=>el('div',{style:'display:flex;gap:8px;align-items:flex-start;border:1px solid #e5e7eb;border-radius:12px;padding:10px'},el('pre',{style:'flex:1;margin:0;white-space:pre-wrap;font:inherit',text:t}),el('small',{class:'muted',text:t.length+'/'+lim}),el('button',{class:'btn',text:'Copiar',onclick:()=>r.copy(t)}))));
 box.append(card('2 · Nombre del perfil y bio','El nombre (máx. 30 caracteres) y la bio (máx. 150) son lo primero que lee Google de tu cuenta.',
  el('b',{text:'Nombre del perfil',style:'display:block;margin-top:10px'}),opts(names,30),el('b',{text:'Bio',style:'display:block;margin-top:12px'}),opts(bios,150),
  el('b',{text:'Enlace de la bio',style:'display:block;margin-top:12px'}),opts([link],999)));
 // 3. Palabras clave
 const cats=new Map();rows.forEach(x=>{const w=r.catWord(x.cat);cats.set(w,(cats.get(w)||0)+1)});
 const brands=new Map();rows.forEach(x=>{if(x.brand)brands.set(x.brand,(brands.get(x.brand)||0)+1)});
 const topCats=[...cats.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]),topBrands=[...brands.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]);
 const kw=['tienda de suplementos '+city,'suplementos '+city,...topCats.flatMap(c=>[c+' '+city,c+' precio Colombia']),...topBrands.map(b=>b+' Colombia')];
 const kwBox=el('div',{style:'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px'},...kw.map(k=>el('button',{class:'btn',text:k,onclick:()=>r.copy(k)})));
 box.append(card('3 · Palabras clave para tus publicaciones','Usa una de estas en la primera línea del texto y en el texto alternativo. Así busca la gente: producto + ciudad, o marca + Colombia. Toca para copiar.',kwBox));
 // 4. Publicaciones viejas
 const q=el('input',{type:'search',placeholder:'Busca el producto de una publicación vieja…',style:'width:100%;margin-top:10px'});
 const out=el('div',{style:'display:grid;gap:8px;margin-top:8px'});
 const draw=()=>{const t=r.norm(q.value).split(/\s+/).filter(Boolean);const top=new Set(r.top());
  const L=(t.length?rows.filter(x=>t.every(w=>r.norm(x.name+' '+x.brand+' '+x.flavor).includes(w))):(rows.filter(x=>top.has(String(x.id))||x.onOffer).length?rows.filter(x=>top.has(String(x.id))||x.onOffer):rows)).slice(0,12);
  out.replaceChildren(...(L.length?L.map(x=>{const a=r.altText(x),l=r.seoLine(x);return el('div',{style:'border:1px solid #e5e7eb;border-radius:12px;padding:10px'},el('b',{text:x.name}),
   el('div',{class:'muted',text:'Primera línea del texto: '+l,style:'margin-top:4px'}),el('div',{class:'muted',text:'Texto alternativo: '+a,style:'margin-top:4px'}),
   el('div',{class:'row',style:'margin-top:6px'},el('button',{class:'btn',text:'Copiar primera línea',onclick:()=>r.copy(l)}),el('button',{class:'btn dark',text:'Copiar texto alternativo',onclick:()=>r.copy(a)})))}):[el('div',{class:'muted',text:'Sin resultados.'})]))};
 q.oninput=draw;draw();
 box.append(card('4 · Arregla tus publicaciones viejas','Google también puede mostrar publicaciones antiguas. Abre cada una → ⋯ → Editar → agrega la primera línea al inicio del texto y, en "Editar texto alternativo", pega el de aquí. Empieza por tus productos más vendidos y en oferta.',q,out));
}

window.SupgoRedesSecciones={render(t){if(rendered[t])return;const box=document.getElementById('p-'+t);if(!box||!R())return;
 if((t==='marcas'||t==='educacion'||t==='google')&&!R().rows().length){box.innerHTML='<div class="card empty">Cargando catálogo…</div>';setTimeout(()=>{box.replaceChildren();this.render(t)},700);return}
 rendered[t]=true;box.replaceChildren();({educacion:renderEducacion,tiktok:renderTiktok,marcas:renderMarcas,google:renderGoogle})[t](box)}};
})();


(()=>{
 const toggle=document.getElementById('liftCalcToggle'),panel=document.getElementById('liftCalcPanel'),display=document.getElementById('liftCalcDisplay'),feedback=document.getElementById('liftCalcFeedback');
 let lastResult='0';
 function calc(raw){
  const t=String(raw).replace(/,/g,'.').replace(/\s+/g,'').match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+*/%-]/g);
  if(!t||t.join('')!==String(raw).replace(/,/g,'.').replace(/\s+/g,''))throw Error('Operación inválida');
  let i=0;
  function primary(){let v=t[i++];if(v==='-')return -primary();if(v==='+')return primary();if(v==='('){let n=add();if(t[i++]!==')')throw Error('Paréntesis incompletos');return n}let n=Number(v);if(!Number.isFinite(n))throw Error('Número inválido');return n}
  function mul(){let n=primary();while(['*','/','%'].includes(t[i])){let op=t[i++],v=primary();if(op==='*')n*=v;else if(op==='/'){if(v===0)throw Error('No se puede dividir por cero');n/=v}else n=n*v/100}return n}
  function add(){let n=mul();while(t[i]==='+'||t[i]==='-'){let op=t[i++],v=mul();n=op==='+'?n+v:n-v}return n}
  let n=add();if(i!==t.length||!Number.isFinite(n))throw Error('Operación inválida');return String(Number(n.toFixed(8)));
 }
 function evaluate(){try{lastResult=calc(display.value);display.value=lastResult;feedback.textContent='';return true}catch(e){feedback.textContent=e.message||'Operación inválida';return false}}
 toggle.addEventListener('click',()=>{panel.classList.toggle('liftCalcOpen');if(panel.classList.contains('liftCalcOpen'))display.focus()});
 document.getElementById('liftCalcClose').addEventListener('click',()=>panel.classList.remove('liftCalcOpen'));
 panel.querySelectorAll('[data-calc]').forEach(b=>b.addEventListener('click',()=>{let k=b.dataset.calc;feedback.textContent='';if(k==='C'){display.value='0';lastResult='0'}else if(k==='⌫'){display.value=display.value.slice(0,-1)||'0'}else if(k==='='){evaluate()}else{display.value=(display.value==='0'&&/^[\d.]$/.test(k)?'':display.value)+k}display.focus()}));
 display.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();evaluate()}});
 document.getElementById('liftCalcCopy').addEventListener('click',async()=>{if(!evaluate())return;try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(lastResult);else{display.select();if(!document.execCommand('copy'))throw Error('No se pudo copiar')}feedback.textContent='Resultado copiado: '+lastResult}catch(e){feedback.textContent='Selecciona el resultado y cópialo manualmente'}});
})();

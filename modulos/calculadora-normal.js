/* SUPGO | Calculadora básica del panel. Independiente de la calculadora de ofertas. */
(function(){
'use strict';
if(window.SupgoCalculadoraNormal)return;
function calculate(expression){
 const tokens=String(expression).replace(/,/g,'.').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\s/g,'').match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+*/%-]/g)||[];
 if(!tokens.length||tokens.join('')!==String(expression).replace(/,/g,'.').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\s/g,''))throw Error('Expresión inválida');
 let i=0;
 function primary(){const t=tokens[i++];if(t==='-')return -primary();if(t==='+')return primary();if(t==='('){const n=add();if(tokens[i++]!==')')throw Error('Falta cerrar paréntesis');return n}if(!t||!/^\d*\.?\d+$/.test(t))throw Error('Número inválido');return Number(t)}
 function percentage(){let n=primary();while(tokens[i]==='%'){i++;n/=100}return n}
 function multiply(){let n=percentage();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=percentage();n=op==='*'?n*b:n/b}return n}
 function add(){let n=multiply();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=multiply();n=op==='+'?n+b:n-b}return n}
 const result=add();if(i!==tokens.length||!Number.isFinite(result))throw Error('Operación inválida');return Math.round((result+Number.EPSILON)*1e10)/1e10;
}
function open(){
 document.getElementById('supgoSimpleCalculator')?.remove();
 const root=document.createElement('div');root.id='supgoSimpleCalculator';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Calculadora');
 root.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#0009;display:grid;place-items:center;padding:16px;box-sizing:border-box';
 root.innerHTML='<section style="width:min(360px,100%);background:#fff;border-radius:18px;padding:20px;box-shadow:0 18px 60px #0003;font:500 15px Poppins,Arial,sans-serif;color:#111"><header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><strong>🧮 Calculadora</strong><button type="button" data-close style="background:#eee;border:0;border-radius:8px;padding:9px 12px;cursor:pointer">Cerrar ✕</button></header><input aria-label="Operación" data-expression inputmode="decimal" autocomplete="off" style="box-sizing:border-box;width:100%;height:58px;border:1px solid #ddd;border-radius:12px;padding:12px;text-align:right;font:600 24px Poppins,Arial,sans-serif"><div data-result aria-live="polite" style="min-height:26px;text-align:right;color:#555;margin:8px 0 14px"></div><div data-keys style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"></div><p style="font-size:11px;color:#666;margin:14px 0 0">Admite +, −, ×, ÷, paréntesis y porcentaje.</p></section>';
 document.body.append(root);
 const input=root.querySelector('[data-expression]'),out=root.querySelector('[data-result]'),keys=root.querySelector('[data-keys]');
 const close=()=>{document.removeEventListener('keydown',esc);root.remove()};
 const esc=e=>{if(e.key==='Escape')close()};
 document.addEventListener('keydown',esc);
 root.querySelector('[data-close]').onclick=close;
 root.onclick=e=>{if(e.target===root)close()};
 const buttons=['C','(',')','⌫','7','8','9','÷','4','5','6','×','1','2','3','−','0','.','%','+','±','=','Copiar'];
 function evaluate(){try{const n=calculate(input.value);out.textContent='= '+n.toLocaleString('es-CO',{maximumFractionDigits:10});return n}catch(e){out.textContent=e.message;return null}}
 input.oninput=()=>{out.textContent=''};
 input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const n=evaluate();if(n!==null)input.value=String(n)}};
 for(const label of buttons){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='min-height:48px;border:0;border-radius:10px;cursor:pointer;font:600 18px Poppins,Arial,sans-serif;background:'+(label==='='?'#151515':label==='C'?'#fee2e2':'#f3f4f6')+';color:'+(label==='='?'white':'#111');if(label==='Copiar'){b.style.gridColumn='span 2';b.style.fontSize='13px'}
 b.onclick=async()=>{if(label==='C'){input.value='';out.textContent=''}else if(label==='⌫'){input.value=input.value.slice(0,-1)}else if(label==='±'){input.value=input.value.startsWith('-')?input.value.slice(1):'-('+input.value+')'}else if(label==='='){const n=evaluate();if(n!==null)input.value=String(n)}else if(label==='Copiar'){const n=evaluate();if(n!==null){try{await navigator.clipboard.writeText(String(n));out.textContent='Resultado copiado'}catch{out.textContent='Selecciona el resultado para copiarlo'}}}else{input.value+=label}input.focus()};keys.append(b)}
 input.focus();
}
window.SupgoCalculadoraNormal={open,calculate};
})();

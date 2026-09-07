from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')
marker = 'id="lift-cliente-5-lineas-patch"'
if marker in text:
    raise SystemExit(0)

patch = r'''
<script id="lift-cliente-5-lineas-patch">
(function(){
  const originalParseCliente = window.parseCliente;
  window.parseCliente = function(texto){
    const base = typeof originalParseCliente === 'function' ? originalParseCliente(texto) : {nombre:'',celular:'',direccion:''};
    const lineas = String(texto || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0,5);
    const idx = lineas.findIndex(x => /direcci[oó]n|calle|carrera|cra\.?|cl\.?|transversal|diagonal|avenida|barrio|apto|apartamento|torre|#/i.test(x));
    if(idx >= 0){
      const partes = [];
      const primera = lineas[idx].replace(/^direcci[oó]n\s*[:\-]?\s*/i,'').trim();
      if(primera) partes.push(primera);
      for(let i=idx+1;i<lineas.length;i++){
        const extra=lineas[i].trim();
        if(!extra) continue;
        if(/\b3\d{9}\b/.test(extra)) continue;
        if(/^nombre\s*[:\-]?/i.test(extra)) continue;
        if(/^(celular|tel[eé]fono|telefono|whatsapp|wp)\s*[:\-]?/i.test(extra)) continue;
        partes.push(extra.replace(/^direcci[oó]n\s*[:\-]?\s*/i,'').trim());
      }
      if(partes.length) base.direccion = partes.join(' - ');
    }
    return base;
  };
})();
</script>
'''

pos = text.lower().rfind('</body>')
if pos >= 0:
    text = text[:pos] + patch + text[pos:]
else:
    text = text + '\n' + patch
p.write_text(text, encoding='utf-8')

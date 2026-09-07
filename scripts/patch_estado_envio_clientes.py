from pathlib import Path

path = Path('index.html')
html = path.read_text(encoding='utf-8')

MARKER = '<!-- LIFT_ESTADO_ENVIO_CLIENTES_V1 -->'
if MARKER in html:
    print('Estado de envío ya instalado; no se hacen cambios.')
    raise SystemExit(0)

patch = r'''
<!-- LIFT_ESTADO_ENVIO_CLIENTES_V1 -->
<style id="lift-estado-envio-clientes-css">
#chShippingBox{margin:0 0 14px;background:#fff;border:1px solid #e5e8f1;border-radius:16px;padding:14px;box-shadow:0 8px 24px rgba(23,43,114,.05)}
#chShippingBox .ship-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
#chShippingBox .ship-head h2{margin:0;color:#102b78;font-size:16px;font-weight:900}
#chShippingBox .ship-head small{color:#70778e;font-size:11px}
#chShippingBox .ship-metrics{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
#chShippingBox .ship-chip{border:1px solid #e0e4ee;background:#f7f9ff;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900;color:#40507c}
#chShippingBox .ship-list{display:grid;gap:7px;max-height:300px;overflow:auto}
#chShippingBox .ship-row{display:grid;grid-template-columns:minmax(170px,1fr) auto auto;gap:8px;align-items:center;border:1px solid #edf0f5;border-radius:12px;padding:9px 10px}
#chShippingBox .ship-client strong{display:block;font-size:12px;color:#0d1533}
#chShippingBox .ship-client small{display:block;margin-top:2px;color:#777e91;font-size:10px}
#chShippingBox .ship-total{font-size:11px;font-weight:900;color:#102b78;white-space:nowrap}
#chShippingBox select{height:34px;border:1px solid #dfe3ee;border-radius:10px;background:#fff;padding:0 8px;font:inherit;font-size:11px;font-weight:800;outline:none}
#chShippingBox select.pending{background:#fff8e7;color:#8a6400;border-color:#f3df9d}
#chShippingBox select.sent{background:#eef3ff;color:#173a91;border-color:#cbd8fb}
#chShippingBox select.delivered{background:#eaf8f0;color:#147346;border-color:#bee8cf}
#chShippingBox .ship-empty{padding:14px;text-align:center;color:#7b8192;font-size:12px}
@media(max-width:700px){#chShippingBox .ship-row{grid-template-columns:1fr auto}#chShippingBox .ship-total{display:none}#chShippingBox select{max-width:130px}}
</style>
<script id="lift-estado-envio-clientes-js">
(function(){
  function money(n){return '$'+Math.round(Number(n)||0).toLocaleString('es-CO');}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function statusOf(p){return p.shippingStatus || 'pending';}
  function label(s){return s==='sent'?'Enviado':s==='delivered'?'Entregado':'Pendiente';}
  function dateText(v){try{return new Date(v).toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit',year:'2-digit'});}catch(e){return '';}}

  function ensureBox(){
    const panel=document.getElementById('clientesPanel');
    if(!panel) return null;
    let box=document.getElementById('chShippingBox');
    if(box) return box;
    const wrap=panel.querySelector('.ch-wrap') || panel;
    box=document.createElement('section');
    box.id='chShippingBox';
    const head=wrap.querySelector('.ch-head');
    if(head && head.nextSibling) wrap.insertBefore(box,head.nextSibling); else wrap.prepend(box);
    return box;
  }

  function render(){
    const box=ensureBox();
    if(!box || typeof window.chLoad!=='function') return;
    const db=window.chLoad();
    const purchases=Array.isArray(db?.purchases)?db.purchases:[];
    const counts={pending:0,sent:0,delivered:0};
    purchases.forEach(p=>{const s=statusOf(p); if(counts[s]!==undefined) counts[s]++;});
    const rows=purchases.map(p=>{
      const s=statusOf(p);
      const name=p?.customer?.name || 'Cliente';
      const phone=p?.customer?.phone || '';
      return `<div class="ship-row">
        <div class="ship-client"><strong>${esc(name)}</strong><small>${esc(phone)} · ${dateText(p.createdAt)}</small></div>
        <div class="ship-total">${money(p.total)}</div>
        <select class="${s}" aria-label="Estado de envío" onchange="liftSetShippingStatus('${esc(p.id)}',this.value)">
          <option value="pending" ${s==='pending'?'selected':''}>Pendiente</option>
          <option value="sent" ${s==='sent'?'selected':''}>Enviado</option>
          <option value="delivered" ${s==='delivered'?'selected':''}>Entregado</option>
        </select>
      </div>`;
    }).join('');
    box.innerHTML=`<div class="ship-head"><div><h2>🚚 Estado de envío</h2><small>Marca cada pedido para acordarte de cuáles ya enviaste.</small></div></div>
      <div class="ship-metrics">
        <span class="ship-chip">Pendientes: ${counts.pending}</span>
        <span class="ship-chip">Enviados: ${counts.sent}</span>
        <span class="ship-chip">Entregados: ${counts.delivered}</span>
      </div>
      <div class="ship-list">${rows || '<div class="ship-empty">Todavía no hay compras guardadas.</div>'}</div>`;
  }

  window.liftSetShippingStatus=function(id,status){
    if(typeof window.chLoad!=='function' || typeof window.chSave!=='function') return;
    const allowed=['pending','sent','delivered'];
    if(!allowed.includes(status)) status='pending';
    const db=window.chLoad();
    const p=(db.purchases||[]).find(x=>String(x.id)===String(id));
    if(!p) return;
    p.shippingStatus=status;
    p.shippingUpdatedAt=new Date().toISOString();
    window.chSave(db);
    render();
  };

  function hook(){
    if(typeof window.chRender==='function' && !window.chRender.__shippingHooked){
      const original=window.chRender;
      const wrapped=function(){const r=original.apply(this,arguments); setTimeout(render,0); return r;};
      wrapped.__shippingHooked=true;
      window.chRender=wrapped;
    }
    render();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',hook); else hook();
})();
</script>
'''

if '</body>' not in html:
    raise RuntimeError('No se encontró </body> en index.html')

html = html.replace('</body>', patch + '\n</body>', 1)
path.write_text(html, encoding='utf-8')
print('Estado de envío instalado en Clientes.')

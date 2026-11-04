from pathlib import Path
import sys,re
sys.dont_write_bytecode=True
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'plantilla-producto'))
from plantilla import render_product
folder=root/'plantilla-producto'
for pid in [117,102,901126]:
 document=render_product(str(pid))
 nav='<nav style="padding:10px 20px;background:#f5f5f5;font:14px Arial" aria-label="Productos de prueba">Probar plantilla: <a href="/plantilla-producto/?id=117">Hyper</a> · <a href="/plantilla-producto/?id=102">Creatina Iron</a> · <a href="/plantilla-producto/?id=901126">ISO 100</a></nav>'
 document=document.replace('<main class="product-page"',nav+'<main class="product-page"',1)
 assert '@@SUPGO_' not in document and 'Agregar al carrito' in document
 (folder/f'producto-{pid}.html').write_text(document)
 if pid==117:
  bootstrap='''<script>(function(){const id=new URLSearchParams(location.search).get('id');if(id&&id!=='117'&&['102','901126'].includes(id))location.replace('./producto-'+id+'.html');})();</script>'''
  (folder/'index.html').write_text(document.replace('</head>',bootstrap+'</head>',1))
 print('Generado',pid,len(document),flush=True)

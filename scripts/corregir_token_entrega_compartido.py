from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="const alreadyTaken=decision==='accepted';"
new="const alreadyTaken=Boolean(p.already_taken)||decision==='accepted';"
if old not in s:
    if new in s:
        print("Token compartido ya corregido")
        raise SystemExit(0)
    raise SystemExit("No se encontró el punto exacto. Sin cambios.")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("Token: estado compartido de Supabase aplicado")

#!/usr/bin/env python3
"""Corrige y bloquea la marca antigua en los archivos públicos generados.

Uso: python scripts/revisar_marca.py carpeta_o_archivo [...]

1. Reemplaza "Lift Nutrientes" (y variantes) por "SUPGO" y el dominio viejo
   lift-nutrientes.vercel.app por supgo.co.
2. Si después de corregir queda algo de la marca antigua, falla el workflow
   para que no se publique.
Las rutas internas en minúscula (por ejemplo /laboratorios/lift-nutrientes/)
no se tocan: solo existen como redirecciones. Tampoco la mención legal
"anteriormente LIFT Nutrientes" de la política de datos.
"""
import re
import sys
from pathlib import Path

EXT = {".html", ".xml", ".json", ".jsonl", ".csv", ".tsv", ".txt", ".js"}
FIXES = [
    (re.compile(r"https?://lift-nutrientes\.vercel\.app"), "https://supgo.co"),
    (re.compile(r"(?<!anteriormente )\bLift[ \u00a0]Nutrientes\b", re.I), "SUPGO"),
    (re.compile(r"\bLiftNutrientes\b"), "SUPGO"),
]
LEFT = re.compile(r"(?<!anteriormente )\bLift[ \u00a0]Nutrientes\b|\bLiftNutrientes\b|lift-nutrientes\.vercel\.app", re.I)


def files(args):
    for a in args:
        p = Path(a)
        if p.is_file():
            yield p
        elif p.is_dir():
            yield from (x for x in p.rglob("*") if x.is_file() and x.suffix.lower() in EXT)


def main(args):
    if not args:
        args = ["."]
    fixed, bad = 0, []
    for p in files(args):
        if ".git" in p.parts or "scripts" in p.parts or p.name == "revisar_marca.py":
            continue
        try:
            s = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        new = s
        for rx, rep in FIXES:
            new = rx.sub(rep, new)
        if new != s:
            p.write_text(new, encoding="utf-8")
            fixed += 1
        if LEFT.search(new):
            bad.append(str(p))
    print(f"Marca revisada: {fixed} archivo(s) corregido(s) a SUPGO")
    if bad:
        sys.exit(f"Marca antigua sin corregir en: {bad[:12]}")


if __name__ == "__main__":
    main(sys.argv[1:])

#!/usr/bin/env python3
"""Exporta productos públicos de SUPGO al formato de catálogo de Meta."""
import csv, io, json, os, re, unicodedata, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://supgo.co"
URL = os.environ.get("SUPABASE_URL", "https://vdxkknftyssjyfbdieqa.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_ANON_KEY", "sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh")
OUTPUT = ROOT / "catalogo-meta.csv"
FIELDS = ["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand"]
# Excluir medicamentos, SARMs y otros productos con riesgo de incumplir políticas de Meta.
RESTRICTED = re.compile(r"\b(?:oxandrolona|stanozolol|sustanon|primobolan|masteron|proviron|testolone|ligandrol|yk[ -]?11|sarm[s]?|esteroide[s]?|anabolizante[s]?|tadalafil|sildenafil|semaglutida|tirzepatida|yohimbina|syneburn|sinefrina|efedrina|clenbuterol|prohormon[a-z]*|testosterona|trenbolona|nandrolona|boldenona|winstrol|dianabol)\b", re.I)

def slug(value):
    s = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", s))[:110]

def fetch(table, fields):
    data = []
    for offset in range(0, 100000, 500):
        query = urllib.parse.urlencode({"select":fields, "order":"id.asc", "limit":500, "offset":offset})
        req = urllib.request.Request(f"{URL}/rest/v1/{table}?{query}", headers={"apikey": KEY, "Authorization": "Bearer " + KEY, "Accept":"application/json"})
        with urllib.request.urlopen(req, timeout=40) as resp:
            batch = json.load(resp)
        if not isinstance(batch, list):
            raise RuntimeError(f"Respuesta inesperada de {table}")
        data.extend(batch)
        if len(batch) < 500:
            break
    return data

def text(value):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", str(value or ""))).strip()

def number(value):
    try:
        value = float(value)
        return int(value) if value > 0 and value == int(value) else None
    except (ValueError, TypeError):
        return None

def valid_image(value):
    value = str(value or "").strip()
    if value.startswith("//"):
        value = "https:" + value
    if value.startswith("/"):
        value = BASE + value
    return value if value.startswith("https://") else None

def main():
    rows = fetch("lift_productos", "id,activo,product")
    private_ids = {str(x["id"]) for x in fetch("lift_private_productos", "id,activo,product")}
    items = []
    excluded = {}
    for r in rows:
        p = r.get("product") or {}
        if not isinstance(p, dict):
            continue
        rid = str(r["id"])
        name = text(p.get("name") or p.get("nombre"))
        brand = text(p.get("brand") or p.get("marca")) or "SUPGO"
        price = number(p.get("price") if p.get("price") is not None else p.get("precio"))
        image = valid_image(p.get("image") or p.get("imagen"))
        if r.get("activo") is not True or rid in private_ids or any(p.get(k) for k in ("__deleted", "__private", "adminOnly", "hidden", "oculto")):
            continue
        if RESTRICTED.search(" ".join([name, brand, text(p.get("category") or p.get("categoria"))])):
            excluded[rid] = name
            continue
        if not (name and price and image and slug(name)):
            continue
        stock = p.get("stock")
        if stock is False or (isinstance(stock, (int, float)) and not isinstance(stock, bool) and stock <= 0):
            availability = "out of stock"
        else:
            status = str(p.get("availability") or p.get("status") or p.get("estado") or "").lower()
            availability = "out of stock" if status in ("outofstock", "out_of_stock", "agotado", "sin stock", "unavailable") else "in stock"
        desc = text(p.get("description") or p.get("descripcion")) or f"{name} de {brand}. Consulta presentación y disponibilidad en SUPGO."
        items.append({"id":rid, "title":name[:150], "description":desc[:5000], "availability":availability,
            "condition":"new", "price":f"{price} COP",
            "link":f"{BASE}/productos/{slug(name)}-{rid}.html", "image_link":image, "brand":brand[:100]})
    if len(items) < 100:
        raise RuntimeError(f"Solo {len(items)} productos válidos; se cancela la publicación para evitar un feed incompleto")
    # csv.DictWriter usa finales de línea estándar y comillas para descripciones con comas.
    with OUTPUT.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(items)
    print(f"Feed Meta generado: {len(items)} productos; {len(excluded)} excluidos por posible restricción")
    print(f"Archivo: {OUTPUT}")

if __name__ == "__main__":
    main()

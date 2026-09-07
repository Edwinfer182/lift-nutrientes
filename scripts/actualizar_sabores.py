import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE = "https://www.suplementoscolombia.co/"
CATALOG_PATH = Path("catalogo/index.html")
FLAVORS_PATH = Path("catalogo/sabores.json")
CHANGES_PATH = Path("catalogo/cambios-sabores.json")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LiftCatalogBot/1.1; +https://lift-nutrientes.vercel.app/)"}
TIMEOUT = 20
MIN_MATCH_SCORE = 0.68
MIN_MATCH_GAP = 0.10

# Palabras que distinguen familias parecidas. Si aparecen solo en uno de los
# dos nombres, no permitimos la asociación automática.
DISTINCTIVE = {
    "ripped", "gold", "whey", "creactor", "build", "tone", "chews",
    "isolate", "isopure", "mass", "gainer", "hardcore", "platinum",
    "serious", "hydro", "elite", "performance", "original", "black",
    "xtreme", "psychotic", "psychopath", "nitro", "cell"
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = value.lower().replace("lbs", "lb").replace("libras", "lb").replace("libra", "lb")
    value = value.replace("gramos", "gr").replace("gramo", "gr")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def get(url: str) -> requests.Response:
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    return r


def discover_sitemaps() -> list[str]:
    urls = []
    try:
        root = get(urljoin(BASE, "sitemap.xml"))
        soup = BeautifulSoup(root.text, "xml")
        locs = [x.get_text(strip=True) for x in soup.find_all("loc")]
        sitemap_locs = [u for u in locs if "sitemap" in u.lower()]
        if sitemap_locs:
            for sitemap in sitemap_locs[:20]:
                try:
                    sub = BeautifulSoup(get(sitemap).text, "xml")
                    urls.extend(x.get_text(strip=True) for x in sub.find_all("loc"))
                except Exception:
                    continue
        else:
            urls.extend(locs)
    except Exception:
        pass
    return list(dict.fromkeys(urls))


def fallback_product_links() -> list[str]:
    urls = []
    try:
        soup = BeautifulSoup(get(urljoin(BASE, "tienda/productos")).text, "html.parser")
        for a in soup.find_all("a", href=True):
            url = urljoin(BASE, a["href"])
            parsed = urlparse(url)
            if parsed.netloc != urlparse(BASE).netloc:
                continue
            path = parsed.path.strip("/")
            if not path or path.startswith(("tienda", "marca", "categoria", "blog", "contact", "politica", "terminos")):
                continue
            urls.append(url)
    except Exception:
        pass
    return list(dict.fromkeys(urls))


def looks_like_product_url(url: str) -> bool:
    p = urlparse(url).path.strip("/").lower()
    if not p or "/" in p:
        return False
    blocked = {
        "", "tienda", "productos", "marcas", "categorias", "contacto", "nosotros", "blog",
        "carrito", "checkout", "login", "registro", "terminos", "politica-de-privacidad"
    }
    return p not in blocked


def text_between(lines: list[str], start_names: tuple[str, ...], end_names: tuple[str, ...]) -> list[str]:
    start = None
    for i, line in enumerate(lines):
        if normalize(line).rstrip(":") in start_names:
            start = i + 1
            break
    if start is None:
        return []
    out = []
    for line in lines[start:]:
        n = normalize(line).rstrip(":")
        if n in end_names:
            break
        if line.strip():
            out.append(line.strip())
    return out


def clean_values(values: list[str]) -> list[str]:
    cleaned = []
    for v in values:
        n = normalize(v)
        if not n:
            continue
        # El sitio inserta placeholders como "Seleccione Sabor" dentro de
        # algunos selectores. Nunca deben llegar al catálogo.
        if any(x in n for x in (
            "selecciona sabor", "seleccione sabor", "seleccionar sabor",
            "escoge sabor", "elige sabor", "selecciona tamano", "seleccione tamano"
        )):
            continue
        if n in {
            "ver", "comprar", "medellin", "nacional", "devolucion", "descripcion",
            "como tomar", "calificaciones", "sabor", "sabores", "tamano"
        }:
            continue
        if len(v) > 80:
            continue
        if re.search(r"\$|hace \d|opinion|categoria|pagos seguros", n):
            continue
        cleaned.append(re.sub(r"\s+", " ", v).strip())
    return list(dict.fromkeys(cleaned))


def parse_product(url: str) -> dict | None:
    try:
        soup = BeautifulSoup(get(url).text, "html.parser")
    except Exception:
        return None

    h1 = soup.find("h1")
    if not h1:
        return None
    name = h1.get_text(" ", strip=True)
    if not name:
        return None

    brand = ""
    brand_link = soup.find("a", href=re.compile(r"/marca/", re.I))
    if brand_link:
        brand = brand_link.get_text(" ", strip=True)

    if not brand:
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "{}")
                objs = data if isinstance(data, list) else [data]
                for obj in objs:
                    if isinstance(obj, dict) and str(obj.get("@type", "")).lower() == "product":
                        b = obj.get("brand")
                        if isinstance(b, dict):
                            brand = str(b.get("name", ""))
                        elif b:
                            brand = str(b)
                        if brand:
                            break
            except Exception:
                continue

    lines = [re.sub(r"\s+", " ", x).strip() for x in soup.stripped_strings]
    flavors = clean_values(text_between(
        lines,
        ("sabor", "sabores"),
        ("tamano", "tamaño", "selecciona sabor y tamano", "medellin", "nacional", "devolucion", "categoria", "descripcion")
    ))
    sizes = clean_values(text_between(
        lines,
        ("tamano", "tamaño"),
        ("selecciona sabor y tamano", "medellin", "nacional", "devolucion", "categoria", "descripcion")
    ))

    if not flavors:
        return None

    return {"name": name, "brand": brand, "flavors": flavors, "sizes": sizes, "source_url": url}


def load_catalog() -> list[dict]:
    html = CATALOG_PATH.read_text(encoding="utf-8")
    for pattern in (
        r"const\s+PRODUCTS\s*=\s*(\[.*?\])\s*;\s*const\s+fmt",
        r"const\s+PRODUCTS\s*=\s*(\[.*?\])\s*;",
    ):
        m = re.search(pattern, html, re.S)
        if m:
            return json.loads(m.group(1))
    raise RuntimeError("No pude encontrar const PRODUCTS en catalogo/index.html")


def token_set(value: str) -> set[str]:
    stop = {"de", "la", "el", "y", "the", "with", "con", "serv", "servicios", "servicio"}
    return {t for t in normalize(value).split() if t not in stop and len(t) > 1}


def size_tokens(value: str) -> set[str]:
    n = normalize(value)
    return {
        m.group(0).replace(",", ".")
        for m in re.finditer(r"\b\d+(?:[\.,]\d+)?\s*(?:lb|kg|gr|g|ml|oz|serv|caps|cap|tabletas|tabs)\b", n)
    }


def catalog_fields(p: dict) -> tuple[str, str, str]:
    return (
        str(p.get("name") or p.get("nombre") or p.get("title") or ""),
        str(p.get("brand") or p.get("marca") or ""),
        str(p.get("presentation") or p.get("presentacion") or p.get("size") or ""),
    )


def distinctive_tokens(value: str) -> set[str]:
    return token_set(value) & DISTINCTIVE


def score_match(local: dict, remote: dict) -> float:
    lname, lbrand, lpresentation = catalog_fields(local)
    rname, rbrand = remote["name"], remote.get("brand", "")

    # Marca diferente = jamás asociar automáticamente.
    if lbrand and rbrand and normalize(lbrand) != normalize(rbrand):
        return 0.0

    # Evita casos como Nitro Tech Ripped -> Nitro Tech normal o Amino EAA -> Amino Tone.
    if distinctive_tokens(lname) != distinctive_tokens(rname):
        return 0.0

    a, b = token_set(lname), token_set(rname)
    if not a or not b:
        return 0.0
    overlap = len(a & b)
    if overlap < 2:
        return 0.0
    jaccard = overlap / max(1, len(a | b))

    lsize = size_tokens(" ".join([lname, lpresentation]))
    rsize = set()
    for s in remote.get("sizes", []):
        rsize |= size_tokens(s)

    # Si ambos lados exponen tamaño y no coincide, se rechaza. No queremos
    # que 2 lb herede variantes de una presentación distinta por accidente.
    if lsize and rsize and not (lsize & rsize):
        return 0.0

    size_bonus = 0.22 if lsize and rsize and (lsize & rsize) else 0.0
    brand_bonus = 0.12 if lbrand and rbrand and normalize(lbrand) == normalize(rbrand) else 0.0
    return max(0.0, min(1.0, jaccard + size_bonus + brand_bonus))


def best_match(local: dict, remotes: list[dict]) -> tuple[dict | None, float]:
    ranked = sorted(((score_match(local, r), r) for r in remotes), key=lambda x: x[0], reverse=True)
    ranked = [x for x in ranked if x[0] > 0]
    if not ranked:
        return None, 0.0
    best_score, best = ranked[0]
    second = ranked[1][0] if len(ranked) > 1 else 0.0
    if best_score < MIN_MATCH_SCORE or (best_score - second) < MIN_MATCH_GAP:
        return None, best_score
    return best, best_score


def main() -> None:
    all_urls = discover_sitemaps()
    product_urls = [u for u in all_urls if looks_like_product_url(u)] or fallback_product_links()

    remotes = []
    for url in product_urls:
        item = parse_product(url)
        if item:
            remotes.append(item)
    if not remotes:
        raise RuntimeError("No se pudo extraer ningún producto con sabores. Se conserva la información anterior.")

    local_products = load_catalog()
    previous = {"products": {}}
    if FLAVORS_PATH.exists():
        try:
            previous = json.loads(FLAVORS_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    prev_products = previous.get("products", {}) if isinstance(previous, dict) else {}

    # Se reconstruye desde cero en cada ejecución. Así una asociación que ya no
    # supera las reglas nuevas desaparece en vez de quedarse eternamente.
    current = {}
    changed = []
    added_products = []
    removed_products = []

    for p in local_products:
        pid = str(p.get("id", "")).strip()
        if not pid:
            continue
        remote, score = best_match(p, remotes)
        if not remote:
            continue

        lname, lbrand, _ = catalog_fields(p)
        entry = {
            "name": lname,
            "brand": lbrand,
            "flavors": remote["flavors"],
            "source_name": remote["name"],
            "source_url": remote["source_url"],
            "source_sizes": remote.get("sizes", []),
            "match_score": round(score, 3),
        }
        current[pid] = entry

        old = prev_products.get(pid)
        if not old:
            added_products.append({"id": pid, "product": lname, "flavors": entry["flavors"]})
        else:
            old_flavors = old.get("flavors", [])
            new_flavors = entry["flavors"]
            added = [x for x in new_flavors if x not in old_flavors]
            removed = [x for x in old_flavors if x not in new_flavors]
            if added or removed:
                changed.append({"id": pid, "product": lname, "added": added, "removed": removed})

    for pid, old in prev_products.items():
        if pid not in current:
            removed_products.append({"id": pid, "product": old.get("name", ""), "reason": "ya no supera el filtro seguro"})

    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "updated_at": now,
        "source": BASE,
        "matched_products": len(current),
        "source_products_with_flavors": len(remotes),
        "products": current,
    }
    report = {
        "updated_at": now,
        "matched_products": len(current),
        "source_products_with_flavors": len(remotes),
        "added_products": added_products,
        "removed_products": removed_products,
        "changed": changed,
    }

    FLAVORS_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    CHANGES_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Productos fuente con sabores: {len(remotes)}")
    print(f"Productos del catálogo asociados con filtro seguro: {len(current)}")
    print(f"Asociaciones retiradas por seguridad: {len(removed_products)}")


if __name__ == "__main__":
    main()

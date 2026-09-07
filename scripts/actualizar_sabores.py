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
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LiftCatalogBot/1.0; +https://lift-nutrientes.vercel.app/)"}
TIMEOUT = 20


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
        n = normalize(line).rstrip(":")
        if n in start_names:
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
    bad = {
        "selecciona sabor y tamano", "selecciona sabor", "selecciona tamano", "ver", "comprar",
        "medellin", "nacional", "devolucion", "descripcion", "como tomar", "calificaciones"
    }
    cleaned = []
    for v in values:
        n = normalize(v)
        if not n or n in bad:
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

    return {
        "name": name,
        "brand": brand,
        "flavors": flavors,
        "sizes": sizes,
        "source_url": url,
    }


def load_catalog() -> list[dict]:
    html = CATALOG_PATH.read_text(encoding="utf-8")
    patterns = [
        r"const\s+PRODUCTS\s*=\s*(\[.*?\])\s*;\s*const\s+fmt",
        r"const\s+PRODUCTS\s*=\s*(\[.*?\])\s*;",
    ]
    for pattern in patterns:
        m = re.search(pattern, html, re.S)
        if m:
            return json.loads(m.group(1))
    raise RuntimeError("No pude encontrar const PRODUCTS en catalogo/index.html")


def token_set(value: str) -> set[str]:
    stop = {"de", "la", "el", "y", "the", "with", "con", "serv", "servicios", "servicio"}
    return {t for t in normalize(value).split() if t not in stop and len(t) > 1}


def size_tokens(value: str) -> set[str]:
    n = normalize(value)
    found = set()
    for m in re.finditer(r"\b\d+(?:[\.,]\d+)?\s*(?:lb|kg|gr|g|ml|oz|serv|caps|cap|tabletas|tabs)\b", n):
        found.add(m.group(0).replace(",", "."))
    return found


def catalog_fields(p: dict) -> tuple[str, str, str]:
    name = str(p.get("name") or p.get("nombre") or p.get("title") or "")
    brand = str(p.get("brand") or p.get("marca") or "")
    presentation = str(p.get("presentation") or p.get("presentacion") or p.get("size") or "")
    return name, brand, presentation


def score_match(local: dict, remote: dict) -> float:
    lname, lbrand, lpresentation = catalog_fields(local)
    rname, rbrand = remote["name"], remote.get("brand", "")

    if lbrand and rbrand and normalize(lbrand) != normalize(rbrand):
        return 0.0

    a, b = token_set(lname), token_set(rname)
    if not a or not b:
        return 0.0
    jaccard = len(a & b) / max(1, len(a | b))

    lsize = size_tokens(" ".join([lname, lpresentation]))
    rsize = set()
    for s in remote.get("sizes", []):
        rsize |= size_tokens(s)
    size_bonus = 0.0
    if lsize and rsize:
        size_bonus = 0.22 if lsize & rsize else -0.25

    brand_bonus = 0.12 if lbrand and rbrand and normalize(lbrand) == normalize(rbrand) else 0.0
    return max(0.0, min(1.0, jaccard + size_bonus + brand_bonus))


def best_match(local: dict, remotes: list[dict]) -> tuple[dict | None, float]:
    ranked = sorted(((score_match(local, r), r) for r in remotes), key=lambda x: x[0], reverse=True)
    if not ranked:
        return None, 0.0
    best_score, best = ranked[0]
    second = ranked[1][0] if len(ranked) > 1 else 0.0
    if best_score < 0.60 or (best_score - second) < 0.08:
        return None, best_score
    return best, best_score


def main() -> None:
    all_urls = discover_sitemaps()
    product_urls = [u for u in all_urls if looks_like_product_url(u)]
    if not product_urls:
        product_urls = fallback_product_links()

    remotes = []
    for url in product_urls:
        item = parse_product(url)
        if item:
            remotes.append(item)

    if not remotes:
        raise RuntimeError("No se pudo extraer ningún producto con sabores. Se conserva la información anterior.")

    local_products = load_catalog()
    previous = {"updated_at": None, "source": BASE, "products": {}}
    if FLAVORS_PATH.exists():
        try:
            previous = json.loads(FLAVORS_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass

    prev_products = previous.get("products", {}) if isinstance(previous, dict) else {}
    current = dict(prev_products)
    changes = {"added": [], "removed": [], "changed": [], "unmatched": []}
    matched_count = 0

    for p in local_products:
        pid = str(p.get("id", "")).strip()
        if not pid:
            continue
        remote, score = best_match(p, remotes)
        if not remote:
            continue

        matched_count += 1
        lname, lbrand, _ = catalog_fields(p)
        old = current.get(pid, {})
        old_flavors = old.get("flavors", []) if isinstance(old, dict) else []
        new_flavors = remote["flavors"]

        entry = {
            "name": lname,
            "brand": lbrand,
            "flavors": new_flavors,
            "source_name": remote["name"],
            "source_url": remote["source_url"],
            "source_sizes": remote.get("sizes", []),
            "match_score": round(score, 3),
        }
        current[pid] = entry

        added = [x for x in new_flavors if x not in old_flavors]
        removed = [x for x in old_flavors if x not in new_flavors]
        if not old and new_flavors:
            changes["added"].append({"id": pid, "product": lname, "flavors": new_flavors})
        elif added or removed:
            changes["changed"].append({"id": pid, "product": lname, "added": added, "removed": removed})

    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "updated_at": now,
        "source": BASE,
        "matched_products": matched_count,
        "source_products_with_flavors": len(remotes),
        "products": current,
    }
    report = {
        "updated_at": now,
        "matched_products": matched_count,
        "source_products_with_flavors": len(remotes),
        **changes,
    }

    FLAVORS_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    CHANGES_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Productos fuente con sabores: {len(remotes)}")
    print(f"Productos del catálogo asociados: {matched_count}")


if __name__ == "__main__":
    main()

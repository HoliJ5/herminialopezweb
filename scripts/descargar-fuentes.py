#!/usr/bin/env python3
"""
Descarga las tipografías de la web a fonts/ y genera fuentes.css.

Uso (desde la raíz del repositorio, con conexión a internet):
    python scripts/descargar-fuentes.py

Opciones:
    --forzar    vuelve a descargar los archivos aunque ya existan

Solo usa la librería estándar de Python (no hay que instalar nada).

Qué hace:
  1. Pide a Google Fonts el CSS de cada familia (fuente variable, formato woff2).
  2. Se queda con los subconjuntos "latin" y "latin-ext" (español con acentos, ñ, etc.).
  3. Descarga cada archivo a fonts/<familia>-<subconjunto>.woff2
  4. Escribe fuentes.css con las reglas @font-face apuntando a esos archivos locales,
     declarando solo los pesos que usa la web.

Para añadir un peso o una familia, edita la lista FUENTES de abajo y vuelve a ejecutarlo.
Después, haz commit de fonts/ y fuentes.css.

Licencias: Inter, Playfair Display y Montserrat usan la SIL Open Font License 1.1,
que permite alojarlas y redistribuirlas libremente (https://openfontlicense.org).
"""
import argparse
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARPETA_FUENTES = RAIZ / "fonts"
ARCHIVO_CSS = RAIZ / "fuentes.css"

# Google solo sirve woff2 (y los comentarios de subconjunto) a navegadores modernos.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)
URL_BASE = "https://fonts.googleapis.com/css2"

# "rango" es lo que se pide a Google; "pesos" son los font-weight que se declaran en fuentes.css.
# Cada peso declarado apunta al mismo archivo (la fuente es variable), así que no se descarga
# nada duplicado. Se declaran solo los pesos que se usan para que el navegador elija igual que antes.
FUENTES = [
    {"familia": "Inter",            "slug": "inter",            "rango": "300..600", "pesos": [300, 400, 600]},
    {"familia": "Playfair Display", "slug": "playfair-display", "rango": "400..600", "pesos": [400, 600]},
    {"familia": "Montserrat",       "slug": "montserrat",       "rango": "600",      "pesos": [600]},
]
SUBCONJUNTOS = ("latin-ext", "latin")  # en este orden: el último declarado gana en solapes

RE_BLOQUE = re.compile(r"/\*\s*([a-z0-9-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", re.S)


def descargar(url, timeout=30):
    peticion = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(peticion, timeout=timeout) as r:
        return r.read()


def campo(bloque, nombre):
    m = re.search(rf"{nombre}\s*:\s*([^;]+);", bloque)
    return m.group(1).strip() if m else None


def bloques_de(familia, rango, url_base):
    """Devuelve {subconjunto: (url_woff2, unicode_range)} para la familia pedida."""
    consulta = f"{url_base}?family={familia.replace(' ', '+')}:wght@{rango}&display=swap"
    try:
        css = descargar(consulta).decode("utf-8")
    except (urllib.error.URLError, TimeoutError) as e:
        sys.exit(f"No se pudo consultar Google Fonts para {familia}: {e}\n¿Tienes conexión a internet?")
    encontrados = {}
    for subconjunto, cuerpo in RE_BLOQUE.findall(css):
        if subconjunto not in SUBCONJUNTOS:
            continue
        m = re.search(r"url\(([^)]+)\)", cuerpo)
        rango_unicode = campo(cuerpo, "unicode-range")
        if not m or not rango_unicode:
            continue
        encontrados[subconjunto] = (m.group(1).strip("'\""), rango_unicode)
    faltan = [s for s in SUBCONJUNTOS if s not in encontrados]
    if faltan:
        sys.exit(
            f"Google no devolvió el subconjunto {', '.join(faltan)} de {familia}.\n"
            "Si el problema persiste, avísame con este mensaje."
        )
    return encontrados


def kb(n):
    return f"{n / 1024:,.0f} KB"


def main():
    ap = argparse.ArgumentParser(description="Descarga las fuentes y genera fuentes.css")
    ap.add_argument("--forzar", action="store_true", help="descarga de nuevo aunque ya existan")
    ap.add_argument("--base-url", default=URL_BASE, help=argparse.SUPPRESS)  # solo para pruebas
    args = ap.parse_args()

    CARPETA_FUENTES.mkdir(exist_ok=True)
    reglas = []
    nuevos = existentes = 0
    total = 0

    for f in FUENTES:
        print(f"{f['familia']}...")
        encontrados = bloques_de(f["familia"], f["rango"], args.base_url)
        for subconjunto in SUBCONJUNTOS:
            url, rango_unicode = encontrados[subconjunto]
            nombre = f"{f['slug']}-{subconjunto}.woff2"
            destino = CARPETA_FUENTES / nombre
            if destino.exists() and not args.forzar:
                existentes += 1
            else:
                datos = descargar(url)
                if datos[:4] != b"wOF2":
                    sys.exit(f"{url} no es un archivo woff2 válido (¿Google cambió el formato?).")
                destino.write_bytes(datos)
                nuevos += 1
            tam = destino.stat().st_size
            total += tam
            print(f"   {nombre:38s} {kb(tam)}")
            for peso in f["pesos"]:
                reglas.append(
                    "@font-face {\n"
                    f"  font-family: '{f['familia']}';\n"
                    "  font-style: normal;\n"
                    f"  font-weight: {peso};\n"
                    "  font-display: swap;\n"
                    f"  src: url('fonts/{nombre}') format('woff2');\n"
                    f"  unicode-range: {rango_unicode};\n"
                    "}\n"
                )

    cabecera = (
        "/* ARCHIVO GENERADO por scripts/descargar-fuentes.py: no lo edites a mano.\n"
        "   Fuentes alojadas en fonts/ (Inter, Playfair Display y Montserrat, licencia SIL OFL 1.1).\n"
        "   Las rutas son relativas a este archivo, que debe estar en la raíz del sitio. */\n\n"
    )
    ARCHIVO_CSS.write_text(cabecera + "\n".join(reglas), encoding="utf-8", newline="\n")

    print(f"\nArchivos nuevos: {nuevos} (ya existían: {existentes})  |  peso total en fonts/: {kb(total)}")
    print(f"Reglas @font-face escritas en {ARCHIVO_CSS.name}: {len(reglas)}")
    print("\nSiguiente paso: haz commit de fonts/ y fuentes.css.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Genera las miniaturas de la galería en img/thumbs/.

Uso (desde la raíz del repositorio):
    pip install pillow            # solo la primera vez
    python scripts/generar-miniaturas.py

Opciones:
    --forzar    regenera todas las miniaturas aunque ya existan
    --limpiar   borra de img/thumbs/ las miniaturas cuya imagen original ya no existe

Cómo funciona:
  * Lee las imágenes que están directamente en img/ (no entra en subcarpetas como
    img/principales ni img/thumbs).
  * Guarda cada miniatura con el MISMO nombre en img/thumbs/. La web calcula la ruta
    de la miniatura sustituyendo "img/" por "img/thumbs/", así que los nombres no
    deben cambiarse.
  * Es incremental: solo procesa imágenes nuevas o modificadas desde la última vez.
  * Nunca agranda una imagen: si el original ya es pequeño, solo se recomprime.
"""
import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip install pillow")

RAIZ = Path(__file__).resolve().parent.parent
IMG = RAIZ / "img"
THUMBS = IMG / "thumbs"

# La miniatura debe cubrir una caja 4:5 de este tamaño (la cuadrícula muestra las
# imágenes en 4:5 con object-cover; ~260x325 px CSS en escritorio, x2 para pantallas retina).
CAJA_ANCHO, CAJA_ALTO = 520, 650
CALIDAD_WEBP = 78
EXTENSIONES = {".webp", ".jpg", ".jpeg", ".png"}


def tamano_miniatura(ancho, alto):
    """Escala mínima para cubrir la caja 4:5, sin agrandar nunca el original."""
    escala = min(1.0, max(CAJA_ANCHO / ancho, CAJA_ALTO / alto))
    return max(1, round(ancho * escala)), max(1, round(alto * escala))


def generar(origen: Path, destino: Path):
    with Image.open(origen) as im:
        im = ImageOps.exif_transpose(im)  # respeta la orientación de fotos de móvil
        nuevo = tamano_miniatura(*im.size)
        if nuevo != im.size:
            im = im.resize(nuevo, Image.LANCZOS)
        ext = origen.suffix.lower()
        if ext == ".webp":
            im.save(destino, "WEBP", quality=CALIDAD_WEBP, method=6)
        elif ext in (".jpg", ".jpeg"):
            im.convert("RGB").save(destino, "JPEG", quality=80, optimize=True, progressive=True)
        else:
            im.save(destino, "PNG", optimize=True)


def referencias_en_json():
    """Rutas de imagen citadas en obras.json e info.json."""
    rutas = set()
    for nombre in ("obras.json", "info.json"):
        ruta = RAIZ / nombre
        if not ruta.exists():
            continue
        for elem in json.loads(ruta.read_text(encoding="utf-8")):
            if elem.get("imagen"):
                rutas.add(elem["imagen"])
            rutas.update(elem.get("imagenes", []))
    return rutas


def kb(n):
    return f"{n / 1024:,.0f} KB"


def main():
    ap = argparse.ArgumentParser(description="Genera miniaturas en img/thumbs/")
    ap.add_argument("--forzar", action="store_true", help="regenera todas")
    ap.add_argument("--limpiar", action="store_true", help="borra miniaturas huérfanas")
    args = ap.parse_args()

    if not IMG.is_dir():
        sys.exit(f"No encuentro la carpeta {IMG}")
    THUMBS.mkdir(exist_ok=True)

    originales = sorted(p for p in IMG.iterdir() if p.is_file() and p.suffix.lower() in EXTENSIONES)
    hechas = saltadas = fallos = 0
    peso_orig = peso_mini = 0

    for origen in originales:
        destino = THUMBS / origen.name
        if not args.forzar and destino.exists() and destino.stat().st_mtime >= origen.stat().st_mtime:
            saltadas += 1
            continue
        try:
            generar(origen, destino)
        except Exception as e:  # imagen corrupta, formato raro...
            fallos += 1
            print(f"  ! No se pudo procesar {origen.name}: {e}")
            continue
        hechas += 1
        peso_orig += origen.stat().st_size
        peso_mini += destino.stat().st_size

    print(f"Originales encontrados: {len(originales)}")
    print(f"Miniaturas generadas:   {hechas}   (ya al día: {saltadas}, con error: {fallos})")
    if hechas:
        ahorro = 100 * (1 - peso_mini / peso_orig) if peso_orig else 0
        print(f"Peso de lo procesado:   {kb(peso_orig)} -> {kb(peso_mini)}  (-{ahorro:.0f}%)")

    # Miniaturas huérfanas (su original ya no existe)
    nombres = {p.name for p in originales}
    huerfanas = [p for p in THUMBS.iterdir() if p.is_file() and p.name not in nombres]
    if huerfanas:
        if args.limpiar:
            for p in huerfanas:
                p.unlink()
            print(f"Miniaturas huérfanas borradas: {len(huerfanas)}")
        else:
            print(f"Aviso: {len(huerfanas)} miniatura(s) sin original (usa --limpiar para borrarlas):")
            for p in huerfanas[:10]:
                print(f"   - {p.name}")

    # Comprobación: imágenes citadas en los JSON que no existen en disco.
    # Útil porque GitHub Pages distingue mayúsculas/minúsculas y Windows no.
    # Se compara el nombre EXACTO (Windows/macOS no distinguen mayúsculas, GitHub Pages sí).
    existentes = {f"img/{p.name}" for p in IMG.iterdir() if p.is_file()}
    en_minusculas = {e.lower(): e for e in existentes}
    faltan = sorted(r for r in referencias_en_json() if r not in existentes)
    if faltan:
        print(f"\nAtención: {len(faltan)} imagen(es) citadas en los JSON no coinciden con ningún archivo de img/:")
        for r in faltan:
            real = en_minusculas.get(r.lower())
            pista = f"  -> existe como '{real}' (cambia mayúsculas/minúsculas)" if real else ""
            print(f"   - {r}{pista}")
    elif hechas or saltadas:
        print("\nTodas las imágenes citadas en los JSON existen en img/.")

    if fallos:
        sys.exit(1)


if __name__ == "__main__":
    main()

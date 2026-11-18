#!/usr/bin/env python3
"""
Genera la imagen que se muestra al compartir la web por WhatsApp, Instagram, Facebook, etc.:
img/principales/compartir.jpg  (JPEG de 1200 x 630 px y menos de 280 KB).

Uso (desde la raiz del repositorio; necesita Pillow, que ya usas para las miniaturas):
    python scripts/generar-imagen-compartir.py

Opciones:
    --origen RUTA   foto de partida (por defecto img/principales/fotoPortada.webp)
    --foco-x N      punto horizontal que debe quedar centrado al recortar, de 0 (izquierda) a 1 (derecha). Por defecto 0.5
    --foco-y N      punto vertical, de 0 (arriba) a 1 (abajo). Por defecto 0.5
    --max-kb N      peso maximo en KB (por defecto 280)

Por que un JPEG aparte: no todas las plataformas aceptan WebP en la vista previa y WhatsApp no la
muestra si la imagen pesa demasiado. La proporcion 1200x630 (1,91:1) es la que usan casi todas.
La foto se recorta al centro (o al punto de foco que indiques), no se deforma.

Despues de ejecutarlo, haz commit de img/principales/compartir.jpg. Si cambias la foto de portada,
vuelve a ejecutarlo.
"""
import argparse
import io
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta Pillow. Instalalo con:  pip install pillow")

RAIZ = Path(__file__).resolve().parent.parent
ANCHO, ALTO = 1200, 630


def recortar(im, foco_x, foco_y):
    """Recorte con la proporcion 1200:630 centrado (lo mas posible) en el punto de foco."""
    w, h = im.size
    objetivo = ANCHO / ALTO
    if w / h > objetivo:          # mas ancha: se recortan los lados
        nuevo_w, nuevo_h = round(h * objetivo), h
    else:                         # mas alta: se recortan arriba y abajo
        nuevo_w, nuevo_h = w, round(w / objetivo)
    izq = min(max(round(foco_x * w - nuevo_w / 2), 0), w - nuevo_w)
    arr = min(max(round(foco_y * h - nuevo_h / 2), 0), h - nuevo_h)
    return im.crop((izq, arr, izq + nuevo_w, arr + nuevo_h))


def guardar_jpeg(im, max_bytes):
    """Prueba calidades de mayor a menor hasta que cabe en el peso maximo."""
    for calidad in range(90, 44, -3):
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=calidad, optimize=True, progressive=True)
        if buf.tell() <= max_bytes:
            return buf.getvalue(), calidad, True
    return buf.getvalue(), calidad, False


def main():
    ap = argparse.ArgumentParser(description="Genera img/principales/compartir.jpg")
    ap.add_argument("--origen", default="img/principales/fotoPortada.webp")
    ap.add_argument("--foco-x", type=float, default=0.5)
    ap.add_argument("--foco-y", type=float, default=0.5)
    ap.add_argument("--max-kb", type=int, default=280)
    args = ap.parse_args()

    origen = Path(args.origen)
    if not origen.is_absolute():
        origen = RAIZ / origen
    if not origen.is_file():
        sys.exit(f"No encuentro la foto de partida: {origen}\nIndica otra con --origen RUTA")
    if not (0 <= args.foco_x <= 1 and 0 <= args.foco_y <= 1):
        sys.exit("--foco-x y --foco-y deben estar entre 0 y 1")

    with Image.open(origen) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        w, h = im.size
        recorte = recortar(im, args.foco_x, args.foco_y)
        if recorte.size[0] < ANCHO:
            print(f"Aviso: la foto de partida es pequena ({w}x{h}); el recorte se ampliara y se vera menos nitido.")
        recorte = recorte.resize((ANCHO, ALTO), Image.LANCZOS)
        datos, calidad, cabe = guardar_jpeg(recorte, args.max_kb * 1024)

    destino = RAIZ / "img" / "principales" / "compartir.jpg"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(datos)
    print(f"Origen:  {origen.name} ({w}x{h})")
    print(f"Creada:  {destino.relative_to(RAIZ)}  {ANCHO}x{ALTO} px, {len(datos) / 1024:,.0f} KB, calidad {calidad}")
    if not cabe:
        print(f"Aviso: no se ha podido bajar de {args.max_kb} KB sin perder demasiada calidad. "
              "WhatsApp podria no mostrar la vista previa; prueba con otra foto (--origen) o con --max-kb mayor.")
    print("\nSiguiente paso: haz commit de img/principales/compartir.jpg")


if __name__ == "__main__":
    main()

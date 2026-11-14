# 🎨 Portafolio de Arte Digital

## 📖 Descripción
Este es un portafolio web estático, minimalista y ultra rápido diseñado específicamente para artistas. Su objetivo principal es mostrar obras de arte (cuadros y diseños de ropa) dando total prioridad al impacto visual. 

## 🛠️ Tecnologías Utilizadas
* **HTML5:** Estructura semántica.
* **Tailwind CSS (v3, compilado):** Estilos, tipografía y maquetación de cuadrículas (CSS Grid). El CSS final está en `estilos.css`.
* **JavaScript (ES6):** Consumo de datos locales (Fetch API) e inyección de componentes estáticos.
* **JSON:** Almacenamiento estructurado de la información de las obras.

## 🖼️ Imágenes y miniaturas
Las imágenes originales viven en `img/`. La cuadrícula, los collages y la tira del modal usan
copias reducidas guardadas en `img/thumbs/` (mismo nombre de archivo), que se generan con un script.

**Cada vez que añadas o cambies una imagen en `img/`:**
1. Instala Pillow la primera vez: `pip install pillow`
2. Desde la raíz del repo, ejecuta: `python scripts/generar-miniaturas.py`
3. Haz commit de la imagen nueva **y** de su miniatura en `img/thumbs/`.

El script solo procesa lo nuevo o modificado, y avisa si algún nombre de imagen citado en
`obras.json` / `info.json` no coincide con un archivo real (por ejemplo, por mayúsculas).
Si se olvida generar una miniatura, la web muestra el original, así que nada se rompe.

## 🎨 Estilos (Tailwind compilado)
Las páginas cargan `estilos.css`, un archivo **generado** con Tailwind (no se edita a mano). Debe estar
en la raíz del repo porque el fondo del inicio usa rutas relativas como `img/principales/...`.

**Hay que recompilar cuando:**
* añadas o cambies clases de Tailwind en cualquier `.html` o en `componentes.js`, o
* crees páginas nuevas o un `.js` que añada clases (en ese caso, añádelos a `content` en `tailwind.config.js`).

**Cómo recompilar:**
1. La primera vez, instala las dependencias (requiere Node.js): `npm install`
2. Genera el CSS: `npm run build`
3. Haz commit de `estilos.css` junto con tus cambios.

Mientras trabajas puedes usar `npm run watch`, que recompila solo al guardar.

Si se te olvida recompilar, las clases nuevas simplemente no tendrán estilo. Los estilos propios que
están en el `<style>` de cada página no necesitan recompilación.

## 🔤 Tipografías (alojadas en el repo)
Inter (texto), Playfair Display (títulos) y Montserrat (logo) se sirven desde la carpeta `fonts/`,
no desde Google. Las reglas `@font-face` están en `fuentes.css`. Ambos se **generan** con un script:

```
python scripts/descargar-fuentes.py
```

Necesita conexión a internet y no requiere instalar nada. Solo hay que volver a ejecutarlo si cambias
las familias o los pesos: edita la lista `FUENTES` al principio del script (por ejemplo, para añadir
`font-bold` hay que declarar el peso 700) y haz commit de `fonts/` y `fuentes.css`.

Pesos declarados: Inter 300/400/600, Playfair Display 400/600 y Montserrat 600. Si una página pide un
peso que no está declarado, el navegador usa el más cercano. No hay cursivas.

Las tres fuentes usan la licencia SIL Open Font License 1.1, que permite alojarlas libremente.

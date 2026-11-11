# 🎨 Portafolio de Arte Digital

## 📖 Descripción
Este es un portafolio web estático, minimalista y ultra rápido diseñado específicamente para artistas. Su objetivo principal es mostrar obras de arte (cuadros y diseños de ropa) dando total prioridad al impacto visual. 

## 🛠️ Tecnologías Utilizadas
* **HTML5:** Estructura semántica.
* **Tailwind CSS (v3 vía CDN):** Estilos, tipografía y maquetación de cuadrículas (CSS Grid).
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

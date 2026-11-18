/** @type {import('tailwindcss').Config} */
module.exports = {
  // Archivos donde Tailwind busca nombres de clase. Si algún día creas un .js nuevo
  // que añada clases (o una carpeta con más páginas), añádelo aquí.
  content: ['./*.html', './componentes.js'],
  theme: {
    extend: {
      // Mismas tipografías que ya declaran las páginas en su <style> (cargadas desde Google Fonts).
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      // Clases que las páginas ya usaban pero que no existen en Tailwind v3 (vienen de la v4 o de un plugin).
      // Se definen aquí con los valores que tienen en la v4.
      boxShadow: {
        '2xs': '0 1px rgb(0 0 0 / 0.05)',      // sombra muy sutil de las tarjetas de contacto
      },
      backdropBlur: {
        xs: '4px',                              // desenfoque ligero del botón "Ver las obras"
      },
      maxWidth: {
        '8xl': '90rem',                         // ancho máximo del contenido del menú superior (1440 px)
      },
    },
  },
  plugins: [
    // Oculta la barra de desplazamiento (la usa la tira de miniaturas del modal).
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-none': { 'scrollbar-width': 'none', '-ms-overflow-style': 'none' },
        '.scrollbar-none::-webkit-scrollbar': { display: 'none' },
      });
    },
  ],
};

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
    },
  },
  plugins: [],
};

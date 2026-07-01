document.addEventListener("DOMContentLoaded", () => {
    
    // Función reutilizable para cargar HTML mediante fetch con opción a ejecutar código extra (callback)
    const cargarComponente = (idContenedor, archivoHtml, callback = null) => {
        const contenedor = document.getElementById(idContenedor);
        if (contenedor) {
            fetch(archivoHtml)
                .then(response => {
                    if (!response.ok) throw new Error(`Error al cargar ${archivoHtml}`);
                    return response.text();
                })
                .then(data => {
                    contenedor.innerHTML = data;
                    
                    // Si se pasó una función extra (callback), se ejecuta una vez que el HTML está inyectado
                    if (callback) {
                        callback();
                    }
                })
                .catch(error => console.error("Error en Fetch:", error));
        }
    };

    // 1. Cargar el Navbar y aplicar la lógica de ocultar enlaces en móvil SOLO en inicio
// 1. Cargar el Navbar
    cargarComponente('nav-placeholder', 'nav.html', () => {
        // Lógica de móvil para inicio
        if (document.body.id === 'pagina-inicio') {
            const menu = document.getElementById('enlaces-menu');
            if (menu) {
                menu.classList.remove('flex');
                menu.classList.add('hidden', 'sm:flex');
            }
        }
        
        // Cuando el navbar está listo, hacemos visible toda la página suavemente
        document.body.classList.remove('opacity-0');
    });

    // 2. Cargar el Footer (no necesita lógica extra, así que no le pasamos callback)
    cargarComponente('footer-placeholder', 'footer.html');

    // 3. Lógica para el botón de WhatsApp
    // Verificamos el ID del body. Si NO es "pagina-inicio", entonces inyectamos el botón.
    if (document.body.id !== 'pagina-inicio') {
        
        // Creamos un contenedor al final del body automáticamente
        const waContainer = document.createElement('div');
        waContainer.id = 'whatsapp-placeholder';
        document.body.appendChild(waContainer);
        
        // Llamamos a la función fetch para cargar el botón dentro de este nuevo contenedor
        cargarComponente('whatsapp-placeholder', 'btnWhatsApp.html');
    }
});
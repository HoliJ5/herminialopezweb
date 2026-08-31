document.addEventListener("DOMContentLoaded", () => {
    
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
                    if (callback) {
                        callback();
                    }
                })
                .catch(error => console.error("Error en Fetch:", error));
        }
    };

    // 1. Cargar el Navbar
    cargarComponente('nav-placeholder', 'nav.html', () => {
        
        // --- LÓGICA BÁSICA DEL MENÚ LATERAL ---
        const btnAbrir = document.getElementById('btn-abrir-menu');
        const btnCerrar = document.getElementById('btn-cerrar-menu');
        const menuLateral = document.getElementById('menu-lateral');
        const overlay = document.getElementById('menu-overlay');

        const abrirMenu = () => {
            menuLateral.classList.remove('translate-x-full');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            document.body.style.overflow = 'hidden';
        };

        const cerrarMenu = () => {
            menuLateral.classList.add('translate-x-full');
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
            document.body.style.overflow = '';
        };

        if (btnAbrir && btnCerrar && menuLateral && overlay) {
            btnAbrir.addEventListener('click', abrirMenu);
            btnCerrar.addEventListener('click', cerrarMenu);
            overlay.addEventListener('click', cerrarMenu);
        }

        // --- LÓGICA DE ACORDEONES DENTRO DEL MENÚ LATERAL ---
        const configurarAcordeon = (btnId, contenidoId, iconoId) => {
            const btn = document.getElementById(btnId);
            const contenido = document.getElementById(contenidoId);
            const icono = document.getElementById(iconoId);
            if(btn && contenido && icono) {
                btn.addEventListener('click', () => {
                    const estaAbierto = !contenido.classList.contains('hidden');
                    if(estaAbierto) {
                        contenido.classList.add('hidden');
                        contenido.classList.remove('flex');
                        icono.classList.remove('rotate-45');
                    } else {
                        contenido.classList.remove('hidden');
                        contenido.classList.add('flex');
                        icono.classList.add('rotate-45');
                    }
                });
            }
        };

        configurarAcordeon('btn-acordeon-portfolio', 'contenido-acordeon-portfolio', 'icono-acordeon-portfolio');
        configurarAcordeon('btn-acordeon-stock', 'contenido-acordeon-stock', 'icono-acordeon-stock');


        // --- LÓGICA DINÁMICA UNIVERSAL: LEER JSON Y POBLAR MENÚ MÓVIL EN TODAS LAS PÁGINAS ---
        fetch('obras.json')
            .then(res => res.json())
            .then(obras => {
                
                // 1. POBLAR ACORDEÓN DE PORTFOLIO
                const contPortfolio = document.getElementById('contenido-acordeon-portfolio');
                if (contPortfolio) {
                    contPortfolio.innerHTML = ''; 
                    
                    const btnTodosPort = document.createElement('a');
                    btnTodosPort.href = "galeria.html";
                    btnTodosPort.textContent = "Mostrar todos";
                    btnTodosPort.className = "block w-full hover:text-white transition-colors py-1 truncate text-[13px]";
                    
                    // Si ya estamos en galería, simulamos el click para no recargar la página entera
                    btnTodosPort.addEventListener('click', (e) => {
                        if (window.location.pathname.includes('galeria')) {
                            e.preventDefault();
                            const btnOriginal = Array.from(document.querySelectorAll('#filtros-contenedor button')).find(b => b.textContent.toLowerCase() === 'mostrar todos');
                            if (btnOriginal) btnOriginal.click();
                            cerrarMenu();
                        }
                    });
                    contPortfolio.appendChild(btnTodosPort);

                    // Extraer los tipos
                    const tiposPortfolio = [...new Set(obras.flatMap(o => Array.isArray(o.tipo) ? o.tipo : [o.tipo]).filter(Boolean))];
                    
                    tiposPortfolio.forEach(tipo => {
                        // Construir el enlace principal del TIPO
                        const btnTipo = document.createElement('a');
                        btnTipo.href = `galeria.html?filtro=${encodeURIComponent(tipo)}`;
                        btnTipo.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                        btnTipo.className = "block w-full hover:text-white transition-colors py-1 mt-2 truncate text-[13px]";
                        
                        btnTipo.addEventListener('click', (e) => {
                            if (window.location.pathname.includes('galeria')) {
                                e.preventDefault();
                                const btnOriginal = Array.from(document.querySelectorAll('#filtros-contenedor button')).find(b => b.textContent.toLowerCase() === tipo.toLowerCase());
                                if (btnOriginal) btnOriginal.click();
                                cerrarMenu();
                            }
                        });
                        contPortfolio.appendChild(btnTipo);

                        // Extraer y construir los SUBTIPOS para este tipo concreto
                        const subtipos = [...new Set(obras.filter(o => {
                            const esDelTipo = Array.isArray(o.tipo) ? o.tipo.includes(tipo) : o.tipo === tipo;
                            return esDelTipo && o.subtipo;
                        }).map(o => o.subtipo))];

                        if (subtipos.length > 0) {
                            subtipos.forEach(sub => {
                                const btnSub = document.createElement('a');
                                btnSub.href = `galeria.html?filtro=${encodeURIComponent(tipo)}&subfiltro=${encodeURIComponent(sub)}`;
                                btnSub.textContent = "- " + sub;
                                btnSub.className = "block w-full hover:text-white text-neutral-400 transition-colors py-1 truncate pl-3 text-[11px]";
                                
                                btnSub.addEventListener('click', (e) => {
                                    if (window.location.pathname.includes('galeria')) {
                                        e.preventDefault();
                                        // Clicamos el tipo y esperamos unos milisegundos a que aparezcan los subtipos para clicar el correcto
                                        const btnT = Array.from(document.querySelectorAll('#filtros-contenedor button')).find(b => b.textContent.toLowerCase() === tipo.toLowerCase());
                                        if (btnT) btnT.click();
                                        
                                        setTimeout(() => {
                                            const btnS = Array.from(document.querySelectorAll('#subfiltros-contenedor button')).find(b => b.textContent.toLowerCase() === sub.toLowerCase());
                                            if (btnS) btnS.click();
                                        }, 50);
                                        cerrarMenu();
                                    }
                                });
                                contPortfolio.appendChild(btnSub);
                            });
                        }
                    });
                }

                // 2. POBLAR ACORDEÓN DE STOCK
                const contStock = document.getElementById('contenido-acordeon-stock');
                if (contStock) {
                    contStock.innerHTML = '';
                    
                    const btnTodosStock = document.createElement('a');
                    btnTodosStock.href = "almacen.html";
                    btnTodosStock.textContent = "Mostrar todos";
                    btnTodosStock.className = "block w-full hover:text-white transition-colors py-1 truncate text-[13px]";
                    btnTodosStock.addEventListener('click', (e) => {
                        if (window.location.pathname.includes('almacen')) {
                            e.preventDefault();
                            const btnOriginal = Array.from(document.querySelectorAll('#filtros-contenedor button')).find(b => b.textContent.toLowerCase() === 'mostrar todos');
                            if (btnOriginal) btnOriginal.click();
                            cerrarMenu();
                        }
                    });
                    contStock.appendChild(btnTodosStock);

                    const obrasStock = obras.filter(o => o.almacen === 1);
                    const tiposStock = [...new Set(obrasStock.map(o => o['tipo-venta']).filter(Boolean))];
                    
                    tiposStock.forEach(tipo => {
                        const btnTipo = document.createElement('a');
                        btnTipo.href = `almacen.html?filtro=${encodeURIComponent(tipo)}`;
                        btnTipo.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                        btnTipo.className = "block w-full hover:text-white transition-colors py-1 mt-2 truncate text-[13px]";
                        
                        btnTipo.addEventListener('click', (e) => {
                            if (window.location.pathname.includes('almacen')) {
                                e.preventDefault();
                                const btnOriginal = Array.from(document.querySelectorAll('#filtros-contenedor button')).find(b => b.textContent.toLowerCase() === tipo.toLowerCase());
                                if (btnOriginal) btnOriginal.click();
                                cerrarMenu();
                            }
                        });
                        contStock.appendChild(btnTipo);
                    });
                }
            })
            .catch(err => console.error("Error al cargar JSON para el menú móvil:", err));


        // NOTA: Se ha eliminado el código que ocultaba el menú de escritorio en la página de inicio.
        
        document.body.classList.remove('opacity-0');
    });

    // 2. Lógica para el Footer
    if (document.body.id !== 'pagina-inicio') {
        cargarComponente('footer-placeholder', 'footer.html');
    } else {
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) footerPlaceholder.remove();
    }

    // 3. Lógica para el botón de WhatsApp
    if (document.body.id !== 'pagina-inicio') {
        const waContainer = document.createElement('div');
        waContainer.id = 'whatsapp-placeholder';
        document.body.appendChild(waContainer);
        cargarComponente('whatsapp-placeholder', './btnWhatsapp.html');
    }
});
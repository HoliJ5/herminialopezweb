// Limpieza automática de la extensión .html en la barra de direcciones (Clean URLs)
if (window.location.protocol.startsWith('http')) {
    if (window.location.pathname.endsWith('/index.html')) {
        const cleanPath = window.location.pathname.replace(/\/index\.html$/, '/') + window.location.search + window.location.hash;
        window.history.replaceState(null, '', cleanPath);
    } else if (window.location.pathname.endsWith('.html')) {
        const cleanPath = window.location.pathname.replace(/\.html$/, '') + window.location.search + window.location.hash;
        window.history.replaceState(null, '', cleanPath);
    }
}

// Compatibilidad local: si se abre con protocolo file://, ajustar enlaces para que apunten al .html correspondiente
if (window.location.protocol === 'file:') {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.endsWith('.html')) {
                const [path, search] = href.split('?');
                if (path === './' || path === '/') {
                    link.href = 'index.html';
                } else {
                    link.href = path + '.html' + (search ? '?' + search : '');
                }
            }
        }
    });
}

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
        const alternarAcordeon = (btn, contenido, icono) => {
            const estaAbierto = !contenido.classList.contains('hidden');
            contenido.classList.toggle('hidden', estaAbierto);
            contenido.classList.toggle('flex', !estaAbierto);
            icono.classList.toggle('rotate-45', !estaAbierto);
            btn.setAttribute('aria-expanded', String(!estaAbierto));
        };

        const configurarAcordeon = (btnId, contenidoId, iconoId) => {
            const btn = document.getElementById(btnId);
            const contenido = document.getElementById(contenidoId);
            const icono = document.getElementById(iconoId);
            if(btn && contenido && icono) {
                btn.setAttribute('aria-expanded', 'false');
                btn.addEventListener('click', () => alternarAcordeon(btn, contenido, icono));
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

                    const buscarBotonFiltro = (selectorContenedor, texto) =>
                        Array.from(document.querySelectorAll(`${selectorContenedor} button`))
                            .find(b => b.textContent.toLowerCase() === texto.toLowerCase());

                    const filtrarPorTipo = (tipo) => {
                        const btnT = buscarBotonFiltro('#filtros-contenedor', tipo);
                        if (btnT) btnT.click();
                    };

                    const filtrarPorSubtipo = (tipo, sub) => {
                        // Clicamos el tipo y esperamos unos milisegundos a que aparezcan los subtipos para clicar el correcto
                        filtrarPorTipo(tipo);
                        setTimeout(() => {
                            const btnS = buscarBotonFiltro('#subfiltros-contenedor', sub);
                            if (btnS) btnS.click();
                        }, 50);
                    };

                    // Enlace final del menú: si ya estamos en galería, simulamos el click para no recargar la página entera.
                    // En cualquier caso se cierra el menú al elegir.
                    const crearEnlaceFiltro = (href, texto, clases, aplicarFiltro) => {
                        const enlace = document.createElement('a');
                        enlace.href = href;
                        enlace.textContent = texto;
                        enlace.className = clases;
                        enlace.addEventListener('click', (e) => {
                            if (window.location.pathname.includes('portfolio')) {
                                e.preventDefault();
                                aplicarFiltro();
                            }
                            cerrarMenu();
                        });
                        return enlace;
                    };

                    const clasesEnlaceTipo = "block w-full hover:text-white transition-colors py-1 mt-2 truncate text-[13px]";
                    const clasesEnlaceSub = "block w-full hover:text-white text-neutral-400 transition-colors py-1 truncate text-[11px]";

                    contPortfolio.appendChild(crearEnlaceFiltro(
                        "portfolio",
                        "Mostrar todos",
                        "block w-full hover:text-white transition-colors py-1 truncate text-[13px]",
                        () => filtrarPorTipo('mostrar todos')
                    ));

                    // Extraer los tipos
                    const tiposPortfolio = [...new Set(obras.flatMap(o => Array.isArray(o.tipo) ? o.tipo : [o.tipo]).filter(Boolean))];

                    tiposPortfolio.forEach(tipo => {
                        const nombreTipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                        const hrefTipo = `portfolio?filtro=${encodeURIComponent(tipo)}`;

                        // Extraer los SUBTIPOS para este tipo concreto
                        const subtipos = [...new Set(obras.filter(o => {
                            const esDelTipo = Array.isArray(o.tipo) ? o.tipo.includes(tipo) : o.tipo === tipo;
                            return esDelTipo && o.subtipo;
                        }).map(o => o.subtipo))];

                        // Tipo sin subtipos: enlace que filtra directamente
                        if (subtipos.length === 0) {
                            contPortfolio.appendChild(crearEnlaceFiltro(hrefTipo, nombreTipo, clasesEnlaceTipo, () => filtrarPorTipo(tipo)));
                            return;
                        }

                        // Tipo con subtipos: botón que abre/cierra su propio subdesplegable
                        const grupo = document.createElement('div');
                        grupo.className = "w-full mt-2";

                        const btnTipo = document.createElement('button');
                        btnTipo.type = "button";
                        btnTipo.className = "w-full flex items-center justify-between gap-2 py-1 text-left text-[13px] uppercase tracking-wider hover:text-white transition-colors focus:outline-none";
                        btnTipo.setAttribute('aria-expanded', 'false');
                        btnTipo.innerHTML = `
                            <span class="truncate"></span>
                            <svg class="w-4 h-4 flex-shrink-0 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        `;
                        btnTipo.querySelector('span').textContent = nombreTipo;
                        const iconoTipo = btnTipo.querySelector('svg');

                        const contSubtipos = document.createElement('div');
                        contSubtipos.className = "hidden flex-col mt-1 pl-3 space-y-1";

                        contSubtipos.appendChild(crearEnlaceFiltro(
                            hrefTipo,
                            `Ver todo`,
                            "block w-full hover:text-white transition-colors py-1 truncate text-[11px]",
                            () => filtrarPorTipo(tipo)
                        ));

                        subtipos.forEach(sub => {
                            contSubtipos.appendChild(crearEnlaceFiltro(
                                `portfolio?filtro=${encodeURIComponent(tipo)}&subfiltro=${encodeURIComponent(sub)}`,
                                "- " + sub,
                                clasesEnlaceSub,
                                () => filtrarPorSubtipo(tipo, sub)
                            ));
                        });

                        btnTipo.addEventListener('click', () => alternarAcordeon(btnTipo, contSubtipos, iconoTipo));

                        grupo.append(btnTipo, contSubtipos);
                        contPortfolio.appendChild(grupo);
                    });
                }

                // 2. POBLAR ACORDEÓN DE STOCK
                const contStock = document.getElementById('contenido-acordeon-stock');
                if (contStock) {
                    contStock.innerHTML = '';
                    
                    const btnTodosStock = document.createElement('a');
                    btnTodosStock.href = "stock";
                    btnTodosStock.textContent = "Mostrar todos";
                    btnTodosStock.className = "block w-full hover:text-white transition-colors py-1 truncate text-[13px]";
                    btnTodosStock.addEventListener('click', (e) => {
                        if (window.location.pathname.includes('stock')) {
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
                        btnTipo.href = `stock?filtro=${encodeURIComponent(tipo)}`;
                        btnTipo.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                        btnTipo.className = "block w-full hover:text-white transition-colors py-1 mt-2 truncate text-[13px]";
                        
                        btnTipo.addEventListener('click', (e) => {
                            if (window.location.pathname.includes('stock')) {
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

    // 2. Lógica para el Footer y ocultar WhatsApp al llegar al final
    let observadorFooter = null;
    const iniciarObservadorFooter = () => {
        const btnWa = document.getElementById('btn-whatsapp');
        const footer = document.querySelector('footer') || document.getElementById('footer-placeholder');

        if (!btnWa || !footer) return;

        if (observadorFooter) observadorFooter.disconnect();

        observadorFooter = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    btnWa.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
                    btnWa.classList.remove('opacity-100', 'translate-y-0');
                } else {
                    btnWa.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
                    btnWa.classList.add('opacity-100', 'translate-y-0');
                }
            });
        }, {
            threshold: 0
        });

        observadorFooter.observe(footer);
    };

    if (document.body.id !== 'pagina-inicio') {
        cargarComponente('footer-placeholder', 'footer.html', iniciarObservadorFooter);
    } else {
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) footerPlaceholder.remove();
    }

    // 3. Lógica para el botón de WhatsApp
    if (document.body.id !== 'pagina-inicio') {
        const waContainer = document.createElement('div');
        waContainer.id = 'whatsapp-placeholder';
        document.body.appendChild(waContainer);
        cargarComponente('whatsapp-placeholder', './btnWhatsapp.html', iniciarObservadorFooter);
    }
});
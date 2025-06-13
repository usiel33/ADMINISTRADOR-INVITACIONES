 // CONFIGURA AQUÍ LA URL DE TU GOOGLE APPS SCRIPT
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbywaIMksKt_P8EswnNJf_J-0vwuVjHuT15fArrFPIiwlZJll4RVqZH--vYGZtQp2X2fgw/exec';
        
        let todasLasInvitaciones = [];
        let invitacionesFiltradas = [];

        // Elementos del DOM
        const loading = document.getElementById('loading');
        const gridInvitaciones = document.getElementById('gridInvitaciones');
        const buscador = document.getElementById('buscador');
        const filtroFecha = document.getElementById('filtroFecha');
        const ordenar = document.getElementById('ordenar');
        const btnRefrescar = document.getElementById('btnRefrescar');

        // Event listeners
        buscador.addEventListener('input', aplicarFiltros);
        filtroFecha.addEventListener('change', aplicarFiltros);
        ordenar.addEventListener('change', aplicarFiltros);
        btnRefrescar.addEventListener('click', cargarDatos);

        // Función para cargar datos desde Google Sheets
        async function cargarDatos() {
            loading.style.display = 'block';
            gridInvitaciones.innerHTML = '';

            try {
                const response = await fetch(SCRIPT_URL + '?action=getData');
                
                if (!response.ok) {
                    throw new Error('Error al cargar datos del servidor');
                }
                
                const data = await response.json();
                todasLasInvitaciones = procesarDatos(data);
                
            } catch (error) {
                console.error('Error al cargar datos:', error);
                gridInvitaciones.innerHTML = `
                    <div class="no-resultados">
                        <span class="emoji-grande">⚠️</span>
                        <div>Error al cargar las invitaciones</div>
                        <div style="font-size: 1rem; margin-top: 10px;">
                            Verifica que hayas configurado correctamente la URL del script
                        </div>
                    </div>
                `;
                todasLasInvitaciones = [];
            }

            loading.style.display = 'none';
            aplicarFiltros();
            actualizarEstadisticas();
        }

        // Función para procesar datos reales de Google Sheets
        function procesarDatos(data) {
            // Verifica que data sea un array y tenga contenido
            if (!Array.isArray(data) || data.length <= 1) {
                return [];
            }
            
            // Asume que data es un array de arrays [[fecha, nombre, relacion, mensaje], ...]
            // La primera fila son los encabezados, así que la omitimos
            return data.slice(1).map(fila => ({
                fecha: fila[0] || 'Sin fecha',
                nombre: fila[1] || 'Sin nombre',
                relacion: fila[2] || 'Sin relación',
                mensaje: fila[3] || 'Sin mensaje'
            })).filter(inv => inv.nombre !== 'Sin nombre'); // Filtrar filas vacías
        }

        // Función para aplicar filtros
        function aplicarFiltros() {
            let resultado = [...todasLasInvitaciones];

            // Filtro por búsqueda
            const textoBusqueda = buscador.value.toLowerCase().trim();
            if (textoBusqueda) {
                resultado = resultado.filter(inv => 
                    inv.nombre.toLowerCase().includes(textoBusqueda) ||
                    inv.relacion.toLowerCase().includes(textoBusqueda)
                );
            }

            // Filtro por fecha
            const filtroSeleccionado = filtroFecha.value;
            if (filtroSeleccionado !== 'todos') {
                const ahora = new Date();
                resultado = resultado.filter(inv => {
                    const fechaInv = new Date(inv.fecha);
                    const diferenciaDias = (ahora - fechaInv) / (1000 * 60 * 60 * 24);
                    
                    switch (filtroSeleccionado) {
                        case 'hoy':
                            return diferenciaDias < 1;
                        case 'semana':
                            return diferenciaDias < 7;
                        case 'mes':
                            return diferenciaDias < 30;
                        default:
                            return true;
                    }
                });
            }

            // Ordenamiento
            const ordenSeleccionado = ordenar.value;
            resultado.sort((a, b) => {
                switch (ordenSeleccionado) {
                    case 'fecha-desc':
                        return new Date(b.fecha) - new Date(a.fecha);
                    case 'fecha-asc':
                        return new Date(a.fecha) - new Date(b.fecha);
                    case 'nombre-asc':
                        return a.nombre.localeCompare(b.nombre);
                    case 'nombre-desc':
                        return b.nombre.localeCompare(a.nombre);
                    default:
                        return 0;
                }
            });

            invitacionesFiltradas = resultado;
            mostrarInvitaciones();
        }

        // Función para mostrar las invitaciones
        function mostrarInvitaciones() {
            if (invitacionesFiltradas.length === 0) {
                gridInvitaciones.innerHTML = `
                    <div class="no-resultados">
                        <span class="emoji-grande">😔</span>
                        <div>No se encontraron invitaciones con los filtros aplicados</div>
                    </div>
                `;
                return;
            }

            const html = invitacionesFiltradas.map(inv => `
                <div class="tarjeta-invitacion">
                    <div class="nombre-invitado">${inv.nombre}</div>
                    <div class="relacion-invitado">${inv.relacion}</div>
                    <div class="mensaje-invitado">"${inv.mensaje}"</div>
                    <div class="fecha-invitacion">📅 ${new Date(inv.fecha).toLocaleDateString()}</div>
                </div>
            `).join('');

            gridInvitaciones.innerHTML = html;
        }

        // Función para actualizar estadísticas
        function actualizarEstadisticas() {
            const ahora = new Date();
            
            const totalInvitados = todasLasInvitaciones.length;
            
            const invitadosHoy = todasLasInvitaciones.filter(inv => {
                const fechaInv = new Date(inv.fecha);
                return (ahora - fechaInv) / (1000 * 60 * 60 * 24) < 1;
            }).length;
            
            const invitadosSemana = todasLasInvitaciones.filter(inv => {
                const fechaInv = new Date(inv.fecha);
                return (ahora - fechaInv) / (1000 * 60 * 60 * 24) < 7;
            }).length;
            
            const relacionesUnicas = new Set(todasLasInvitaciones.map(inv => inv.relacion)).size;

            // Animación de contadores
            animarContador('totalInvitados', totalInvitados);
            animarContador('invitadosHoy', invitadosHoy);
            animarContador('invitadosSemana', invitadosSemana);
            animarContador('relacionesUnicas', relacionesUnicas);
        }

        // Función para animar contadores
        function animarContador(elementId, valorFinal) {
            const elemento = document.getElementById(elementId);
            const valorInicial = 0;
            const duracion = 1000;
            const incremento = valorFinal / (duracion / 16);
            let valorActual = valorInicial;

            const timer = setInterval(() => {
                valorActual += incremento;
                if (valorActual >= valorFinal) {
                    valorActual = valorFinal;
                    clearInterval(timer);
                }
                elemento.textContent = Math.floor(valorActual);
            }, 16);
        }

        // Cargar datos al iniciar
        cargarDatos();
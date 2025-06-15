// CONFIGURA AQUÍ LA URL DE TU GOOGLE APPS SCRIPT
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz5-WLlt3_XY5k2NgJyyHepMjk2r0oAzrCeGSIaqNkTjm1Oe9Ua1gRlGNVxQDUBfcwZOg/exec';

    // CONFIGURA AQUÍ LA URL DE TU IMAGEN DE WHATSAPP (puedes usar un emoji como ícono)
  const WHATSAPP_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/733/733585.png';


    let todasLasInvitaciones = [];
    let invitacionesFiltradas = [];
    let filtroActivo = 'todos';

    const loading = document.getElementById('loading');
    const gridInvitaciones = document.getElementById('gridInvitaciones');
    const buscador = document.getElementById('buscador');
    const filtroFecha = document.getElementById('filtroFecha');
    const ordenar = document.getElementById('ordenar');
    const btnRefrescar = document.getElementById('btnRefrescar');

    // Botones de filtro de estado
    const filtroTodos = document.getElementById('filtroTodos');
    const filtroAsisten = document.getElementById('filtroAsisten');
    const filtroNoAsisten = document.getElementById('filtroNoAsisten');
    const filtroFamiliares = document.getElementById('filtroFamiliares');
    const filtroExtranos = document.getElementById('filtroExtranos');

    // Lista de relaciones familiares
    const relacionesFamiliares = [
      'padre', 'madre', 'hijo', 'hija', 'hermano', 'hermana',
      'abuelo', 'abuela', 'nieto', 'nieta', 'tio', 'tía', 'tio', 
      'sobrino', 'sobrina', 'primo', 'prima', 'suegro', 'suegra',
      'yerno', 'nuera', 'cuñado', 'cuñada', 'padrino', 'madrina',
      'ahijado', 'ahijada', 'bisabuelo', 'bisabuela', 'tatara',
      'familiar', 'familia', 'pariente', 'esposo', 'esposa'
    ];

    // Eventos
    buscador.addEventListener('input', aplicarFiltros);
    filtroFecha.addEventListener('change', aplicarFiltros);
    ordenar.addEventListener('change', aplicarFiltros);
    btnRefrescar.addEventListener('click', cargarDatos);

    // Eventos de filtros de estado
    filtroTodos.addEventListener('click', () => cambiarFiltroEstado('todos'));
    filtroAsisten.addEventListener('click', () => cambiarFiltroEstado('asisten'));
    filtroNoAsisten.addEventListener('click', () => cambiarFiltroEstado('no_asisten'));
    filtroFamiliares.addEventListener('click', () => cambiarFiltroEstado('familiares'));
    filtroExtranos.addEventListener('click', () => cambiarFiltroEstado('extraños'));

    function cambiarFiltroEstado(nuevoFiltro) {
      filtroActivo = nuevoFiltro;
      
      // Actualizar estilos de botones
      document.querySelectorAll('.boton-filtro').forEach(btn => btn.classList.remove('activo'));
      
      switch(nuevoFiltro) {
        case 'todos': filtroTodos.classList.add('activo'); break;
        case 'asisten': filtroAsisten.classList.add('activo'); break;
        case 'no_asisten': filtroNoAsisten.classList.add('activo'); break;
        case 'familiares': filtroFamiliares.classList.add('activo'); break;
        case 'extraños': filtroExtranos.classList.add('activo'); break;
      }
      
      aplicarFiltros();
    }

    function esFamiliar(relacion) {
      if (!relacion) return false;
      const relacionLower = relacion.toLowerCase();
      return relacionesFamiliares.some(familiar => relacionLower.includes(familiar));
    }

    function limpiarNumero(numero) {
      if (!numero) return '';
      return numero.toString().replace(/\D/g, '');
    }

    function generarUrlWhatsApp(numero) {
      const numeroLimpio = limpiarNumero(numero);
      if (!numeroLimpio) return null;
      let numeroCompleto = numeroLimpio;
      if (numeroLimpio.length === 9 && !numeroLimpio.startsWith('51')) {
        numeroCompleto = '51' + numeroLimpio;
      }
      return `https://wa.me/${numeroCompleto}`;
    }

    async function cargarDatos() {
      loading.style.display = 'block';
      gridInvitaciones.innerHTML = '';

      try {
        const response = await fetch(SCRIPT_URL + '?action=getData');
        if (!response.ok) throw new Error('Error al cargar datos del servidor');
        const result = await response.json();
        if (result.success && result.data) {
          todasLasInvitaciones = result.data.filter(inv => inv.nombre && inv.nombre.trim() !== '');
        } else {
          throw new Error('Formato de datos incorrecto');
        }
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

    function aplicarFiltros() {
      let resultado = [...todasLasInvitaciones];

      // Filtro por texto de búsqueda
      const textoBusqueda = buscador.value.toLowerCase().trim();
      if (textoBusqueda) {
        resultado = resultado.filter(inv =>
          inv.nombre.toLowerCase().includes(textoBusqueda) ||
          inv.relacion.toLowerCase().includes(textoBusqueda)
        );
      }

      // Filtro por estado y tipo
      switch(filtroActivo) {
        case 'asisten':
          resultado = resultado.filter(inv => !inv.estado || inv.estado === 'asiste');
          break;
        case 'no_asisten':
          resultado = resultado.filter(inv => inv.estado === 'no_asiste');
          break;
        case 'familiares':
          resultado = resultado.filter(inv => esFamiliar(inv.relacion));
          break;
        case 'extraños':
          resultado = resultado.filter(inv => !esFamiliar(inv.relacion));
          break;
        // 'todos' no filtra nada
      }

      // Filtro por fecha
      const filtroSeleccionado = filtroFecha.value;
      if (filtroSeleccionado !== 'todos') {
        const ahora = new Date();
        resultado = resultado.filter(inv => {
          const fechaInv = new Date(inv.fecha);
          const diferenciaDias = (ahora - fechaInv) / (1000 * 60 * 60 * 24);
          switch (filtroSeleccionado) {
            case 'hoy': return diferenciaDias < 1;
            case 'semana': return diferenciaDias < 7;
            case 'mes': return diferenciaDias < 30;
            default: return true;
          }
        });
      }

      // Ordenar
      const ordenSeleccionado = ordenar.value;
      resultado.sort((a, b) => {
        switch (ordenSeleccionado) {
          case 'fecha-desc': return new Date(b.fecha) - new Date(a.fecha);
          case 'fecha-asc': return new Date(a.fecha) - new Date(b.fecha);
          case 'nombre-asc': return a.nombre.localeCompare(b.nombre);
          case 'nombre-desc': return b.nombre.localeCompare(a.nombre);
          default: return 0;
        }
      });

      invitacionesFiltradas = resultado;
      mostrarInvitaciones();
    }

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

      const html = invitacionesFiltradas.map((inv, index) => {
        const fechaFormateada = new Date(inv.fecha).toLocaleDateString();
        const numero = inv.numero ? inv.numero : '';
        const tieneNumero = numero && numero.toString().trim() !== '';
        const estado = inv.estado || 'asiste';
        const noAsiste = estado === 'no_asiste';

        return `
          <div class="tarjeta-invitacion ${noAsiste ? 'no-asiste' : ''}" data-index="${index}">
            <div class="header-tarjeta">
              <div class="info-invitado">
                <div class="nombre-invitado">${inv.nombre}</div>
                <div class="relacion-invitado">${inv.relacion}</div>
                <div class="estado-invitado ${noAsiste ? 'estado-no-asiste' : 'estado-asiste'}">
                  ${noAsiste ? '❌ No asiste' : '✅ Asiste'}
                </div>
              </div>
              <a href="#" class="boton-whatsapp ${tieneNumero ? '' : 'disabled'}" 
                 title="${tieneNumero ? 'Contactar por WhatsApp' : 'Sin número de teléfono'}" 
                 target="_blank">
                <img src="${WHATSAPP_ICON_URL}" alt="WhatsApp" class="whatsapp-icon ${tieneNumero ? '' : 'disabled-icon'}">
              </a>
            </div>
            
            ${inv.mensaje ? `<div class="mensaje-invitado">"${inv.mensaje}"</div>` : ''}
            
            ${noAsiste && inv.motivoNoAsistencia ? 
              `<div class="motivo-no-asistencia"><strong>Motivo:</strong> ${inv.motivoNoAsistencia}</div>` : ''}
            
            <div class="footer-tarjeta">
              <div class="fecha-invitacion">📅 ${fechaFormateada}</div>
              <div class="numero-telefono">${tieneNumero ? `📞 ${numero}` : `<span style="color: #ccc;">Sin número</span>`}</div>
            </div>
          </div>
        `;
      }).join('');

      gridInvitaciones.innerHTML = html;

      // Asignar href a cada botón de WhatsApp
      document.querySelectorAll('.tarjeta-invitacion').forEach((card, index) => {
        const invitado = invitacionesFiltradas[index];
        const link = card.querySelector('.boton-whatsapp');
        if (invitado.numero && link && !link.classList.contains('disabled')) {
          const url = generarUrlWhatsApp(invitado.numero);
          if (url) {
            link.href = url;
          }
        }
      });
    }

    function actualizarEstadisticas() {
      const totalInvitados = todasLasInvitaciones.length;
      const totalAsisten = todasLasInvitaciones.filter(inv => !inv.estado || inv.estado === 'asiste').length;
      const familiares = todasLasInvitaciones.filter(inv => esFamiliar(inv.relacion)).length;
      const conocidos = totalInvitados - familiares;

      animarContador('totalInvitados', totalInvitados);
      animarContador('totalAsisten', totalAsisten);
      animarContador('familiares', familiares);
      animarContador('conocidos', conocidos);
    }

    function animarContador(elementId, valorFinal) {
      const elemento = document.getElementById(elementId);
      const duracion = 1000;
      const incremento = valorFinal / (duracion / 16);
      let valorActual = 0;
      const timer = setInterval(() => {
        valorActual += incremento;
        if (valorActual >= valorFinal) {
          valorActual = valorFinal;
          clearInterval(timer);
        }
        elemento.textContent = Math.floor(valorActual);
      }, 16);
    }

    // Cargar datos al inicio
    cargarDatos();
// CONFIGURA AQUÍ LA URL DE TU GOOGLE APPS SCRIPT
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPcc3WNrI4tba9NASDHFho8-Czl0FeB3vscIJCvxgSU0bZlIS1g4YqG4Nu5M-D_tNKpw/exec';

// CONFIGURA AQUÍ LA URL DE TU IMAGEN DE WHATSAPP
const WHATSAPP_ICON_URL = 'img/icono.png';

let todasLasInvitaciones = [];
let invitacionesFiltradas = [];

const loading = document.getElementById('loading');
const gridInvitaciones = document.getElementById('gridInvitaciones');
const buscador = document.getElementById('buscador');
const filtroFecha = document.getElementById('filtroFecha');
const ordenar = document.getElementById('ordenar');
const btnRefrescar = document.getElementById('btnRefrescar');

// Eventos
buscador.addEventListener('input', aplicarFiltros);
filtroFecha.addEventListener('change', aplicarFiltros);
ordenar.addEventListener('change', aplicarFiltros);
btnRefrescar.addEventListener('click', cargarDatos);

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

  const textoBusqueda = buscador.value.toLowerCase().trim();
  if (textoBusqueda) {
    resultado = resultado.filter(inv =>
      inv.nombre.toLowerCase().includes(textoBusqueda) ||
      inv.relacion.toLowerCase().includes(textoBusqueda)
    );
  }

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

    return `
      <div class="tarjeta-invitacion" data-index="${index}">
        <div class="header-tarjeta">
          <div class="info-invitado">
            <div class="nombre-invitado">${inv.nombre}</div>
            <div class="relacion-invitado">${inv.relacion}</div>
          </div>
          <a href="#" class="boton-whatsapp ${tieneNumero ? '' : 'disabled'}" 
             title="${tieneNumero ? 'Contactar por WhatsApp' : 'Sin número de teléfono'}" 
             target="_blank">
            <img src="${WHATSAPP_ICON_URL}" alt="WhatsApp" class="whatsapp-icon ${tieneNumero ? '' : 'disabled-icon'}">
          </a>
        </div>
        <div class="mensaje-invitado">"${inv.mensaje}"</div>
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

  animarContador('totalInvitados', totalInvitados);
  animarContador('invitadosHoy', invitadosHoy);
  animarContador('invitadosSemana', invitadosSemana);
  animarContador('relacionesUnicas', relacionesUnicas);
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

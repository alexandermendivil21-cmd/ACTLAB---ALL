// FRONTEND/public/admin-citas.js
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si el usuario es médico
  const userCargo = sessionStorage.getItem("userCargo");
  const isMedico = userCargo === "medico";
  
  // Variables globales
  let todasLasCitas = [];
  let citasFiltradas = [];
  let fechaActual = new Date();
  let vistaActual = 'mensual';
  let citaEditando = null;

  // Referencias DOM
  const filtroEstado = document.getElementById('filtroEstado');
  const filtroTipoExamen = document.getElementById('filtroTipoExamen');
  const filtroFecha = document.getElementById('filtroFecha');
  const filtroPaciente = document.getElementById('filtroPaciente');
  const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
  const btnAgregarCita = document.getElementById('btnAgregarCita');
  const citasBody = document.getElementById('citasBody');
  const emptyState = document.getElementById('emptyState');
  const tablaCitas = document.getElementById('tablaCitas');
  const modalCita = document.getElementById('modalCita');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const btnCancelar = document.getElementById('btnCancelar');
  const formCita = document.getElementById('formCita');
  const btnMesAnterior = document.getElementById('btnMesAnterior');
  const btnMesSiguiente = document.getElementById('btnMesSiguiente');
  const mesActual = document.getElementById('mesActual');
  const btnVistaMensual = document.getElementById('btnVistaMensual');
  const btnVistaHorario = document.getElementById('btnVistaHorario');
  const vistaMensual = document.getElementById('vistaMensual');
  const vistaHorario = document.getElementById('vistaHorario');
  const calendarGrid = document.getElementById('calendarGrid');

  // Inicialización
  init();

  // ============================================
  // FUNCIONES DE INICIALIZACIÓN
  // ============================================
  function init() {
    cargarCitas();
    setupEventListeners();
    actualizarCalendario();
  }

  function setupEventListeners() {
    // Filtros
    filtroEstado.addEventListener('change', aplicarFiltros);
    filtroTipoExamen.addEventListener('change', aplicarFiltros);
    filtroFecha.addEventListener('change', aplicarFiltros);
    filtroPaciente.addEventListener('input', aplicarFiltros);
    btnLimpiarFiltros.addEventListener('click', limpiarFiltros);

    // Modal - Solo si no es médico
    if (!isMedico) {
      btnAgregarCita.addEventListener('click', () => abrirModal(false));
    } else {
      // Ocultar botón de agregar cita para médicos
      if (btnAgregarCita) {
        btnAgregarCita.style.display = 'none';
      }
    }
    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);

    // Botón de actualizar
    const btnRefreshCitas = document.getElementById('btnRefreshCitas');
    if (btnRefreshCitas) {
      btnRefreshCitas.addEventListener('click', async () => {
        btnRefreshCitas.disabled = true;
        const originalHTML = btnRefreshCitas.innerHTML;
        btnRefreshCitas.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
        
        try {
          await cargarCitas();
          // Mostrar mensaje de éxito si hay alguna función de notificación
          if (typeof alert !== 'undefined') {
            // Opcional: mostrar mensaje de éxito
          }
        } catch (error) {
          console.error('Error al actualizar citas:', error);
          if (typeof alert !== 'undefined') {
            alert('Error al actualizar las citas');
          }
        } finally {
          btnRefreshCitas.disabled = false;
          btnRefreshCitas.innerHTML = originalHTML;
        }
      });
    }
    formCita.addEventListener('submit', guardarCita);

    // Calendario
    btnMesAnterior.addEventListener('click', () => {
      fechaActual.setMonth(fechaActual.getMonth() - 1);
      actualizarCalendario();
    });
    btnMesSiguiente.addEventListener('click', () => {
      fechaActual.setMonth(fechaActual.getMonth() + 1);
      actualizarCalendario();
    });

    // Vistas
    btnVistaMensual.addEventListener('click', () => cambiarVista('mensual'));
    btnVistaHorario.addEventListener('click', () => cambiarVista('horario'));

    // Cerrar modal al hacer clic fuera
    modalCita.addEventListener('click', (e) => {
      if (e.target === modalCita) cerrarModal();
    });
  }

  // ============================================
  // FUNCIONES DE API
  // ============================================
  async function cargarCitas() {
    try {
      // Endpoint para admin: obtener todas las citas sin filtrar por email
      const response = await fetch('/api/admin/citas');
      
      if (!response.ok) {
        throw new Error('Error al cargar las citas');
      }

      const data = await response.json();
      todasLasCitas = Array.isArray(data) ? data : [];
      
      // Asegurar que todas las citas tengan estado
      todasLasCitas = todasLasCitas.map(cita => ({
        ...cita,
        estado: cita.estado || 'pendiente'
      }));

      aplicarFiltros();
    } catch (error) {
      console.error('Error al cargar citas:', error);
      todasLasCitas = [];
      citasFiltradas = [];
      renderizarCitas();
    }
  }

  async function crearCita(datos) {
    try {
      const response = await fetch('/api/admin/citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la cita');
      }

      const resultado = await response.json();
      return resultado;
    } catch (error) {
      console.error('Error al crear cita:', error);
      throw error;
    }
  }

  async function actualizarCita(id, datos) {
    try {
      const response = await fetch(`/api/admin/citas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar la cita');
      }

      const resultado = await response.json();
      return resultado;
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      throw error;
    }
  }

  async function eliminarCita(id) {
    try {
      const response = await fetch(`/api/admin/citas/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar la cita');
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      throw error;
    }
  }

  // ============================================
  // FUNCIONES DE FILTRADO
  // ============================================
  function aplicarFiltros() {
    citasFiltradas = [...todasLasCitas];

    // Filtro por estado
    const estadoFiltro = filtroEstado.value;
    if (estadoFiltro) {
      citasFiltradas = citasFiltradas.filter(cita => 
        cita.estado === estadoFiltro
      );
    }

    // Filtro por tipo de examen
    const tipoFiltro = filtroTipoExamen.value;
    if (tipoFiltro) {
      citasFiltradas = citasFiltradas.filter(cita => 
        cita.especialidad === tipoFiltro
      );
    }

    // Filtro por fecha
    const fechaFiltro = filtroFecha.value;
    if (fechaFiltro) {
      const fechaBusqueda = new Date(fechaFiltro);
      citasFiltradas = citasFiltradas.filter(cita => {
        const fechaCita = new Date(cita.fechaCita);
        return fechaCita.toDateString() === fechaBusqueda.toDateString();
      });
    }

    // Filtro por paciente (busca en nombre, apellidos y email)
    const pacienteFiltro = filtroPaciente.value.toLowerCase().trim();
    if (pacienteFiltro) {
      citasFiltradas = citasFiltradas.filter(cita => {
        const emailMatch = cita.email.toLowerCase().includes(pacienteFiltro);
        const nombreMatch = cita.paciente && cita.paciente.nombres && 
          cita.paciente.nombres.toLowerCase().includes(pacienteFiltro);
        const apellidoMatch = cita.paciente && cita.paciente.apellidos && 
          cita.paciente.apellidos.toLowerCase().includes(pacienteFiltro);
        const nombreCompleto = cita.paciente && cita.paciente.nombres && cita.paciente.apellidos
          ? `${cita.paciente.nombres} ${cita.paciente.apellidos}`.toLowerCase()
          : '';
        const nombreCompletoMatch = nombreCompleto.includes(pacienteFiltro);
        
        return emailMatch || nombreMatch || apellidoMatch || nombreCompletoMatch;
      });
    }

    renderizarCitas();
    actualizarCalendario();
  }

  function limpiarFiltros() {
    filtroEstado.value = '';
    filtroTipoExamen.value = '';
    filtroFecha.value = '';
    filtroPaciente.value = '';
    aplicarFiltros();
  }

  // ============================================
  // FUNCIONES DE RENDERIZADO
  // ============================================
  function renderizarCitas() {
    if (citasFiltradas.length === 0) {
      tablaCitas.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    tablaCitas.classList.remove('hidden');
    emptyState.classList.add('hidden');

    citasBody.innerHTML = citasFiltradas
      .sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita))
      .map(cita => {
        const fecha = new Date(cita.fechaCita);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const horaFormateada = cita.horario || 'Sin hora';

        // Obtener nombre del paciente
        let nombrePaciente = 'N/A';
        if (cita.paciente && cita.paciente.nombres && cita.paciente.apellidos) {
          nombrePaciente = `${cita.paciente.nombres} ${cita.paciente.apellidos}`;
        } else if (cita.paciente && cita.paciente.nombres) {
          nombrePaciente = cita.paciente.nombres;
        }

        // Obtener email
        const emailPaciente = cita.email || 'N/A';

        // Obtener motivo de la cita
        const motivoCita = cita.motivoCita || 'N/A';

        return `
          <tr>
            <td>${fechaFormateada} ${horaFormateada}</td>
            <td>${nombrePaciente}</td>
            <td>${emailPaciente}</td>
            <td>${cita.especialidad}</td>
            <td>${motivoCita}</td>
            <td>
              <span class="status-badge ${cita.estado || 'pendiente'}">
                ${cita.estado || 'pendiente'}
              </span>
            </td>
            <td>
              <div class="acciones-buttons">
                <button class="btn-action view" onclick="verCita('${cita._id}')" title="Ver">
                  <i class="fa-solid fa-eye"></i>
                </button>
                ${!isMedico ? `
                <button class="btn-action edit" onclick="editarCita('${cita._id}')" title="Editar">
                  <i class="fa-solid fa-pencil"></i>
                </button>
                <button class="btn-action delete" onclick="eliminarCitaConfirm('${cita._id}')" title="Eliminar">
                  <i class="fa-solid fa-trash"></i>
                </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // ============================================
  // FUNCIONES DEL MODAL
  // ============================================
  function abrirModal(editando, cita = null) {
    // Verificar si el usuario es médico
    const userCargo = sessionStorage.getItem("userCargo");
    if (userCargo === "medico") {
      alert('No tienes permisos para agregar o editar citas');
      return;
    }
    
    citaEditando = editando ? cita : null;
    const modalTitulo = document.getElementById('modalTitulo');
    
    if (editando && cita) {
      modalTitulo.textContent = 'Editar Cita';
      document.getElementById('inputEmail').value = cita.email || '';
      document.getElementById('inputTipoExamen').value = cita.especialidad || '';
      document.getElementById('inputFecha').value = cita.fechaCita ? new Date(cita.fechaCita).toISOString().split('T')[0] : '';
      document.getElementById('inputHorario').value = cita.horario || '';
      document.getElementById('inputMotivo').value = cita.motivoCita || '';
      
      // Establecer estado, pero si es "completada" cambiarlo a "confirmada" ya que no está disponible en el formulario
      const estadoSelect = document.getElementById('inputEstado');
      const estadoCita = cita.estado || 'pendiente';
      if (estadoCita === 'completada') {
        estadoSelect.value = 'confirmada'; // Cambiar a confirmada si estaba completada
      } else {
        estadoSelect.value = estadoCita;
      }
    } else {
      modalTitulo.textContent = 'Agregar Nueva Cita';
      formCita.reset();
      document.getElementById('inputEstado').value = 'pendiente';
      document.getElementById('inputFecha').valueAsDate = new Date();
    }

    modalCita.classList.remove('hidden');
  }

  function cerrarModal() {
    modalCita.classList.add('hidden');
    citaEditando = null;
    formCita.reset();
  }

  async function guardarCita(e) {
    e.preventDefault();
    
    // Verificar si el usuario es médico
    const userCargo = sessionStorage.getItem("userCargo");
    if (userCargo === "medico") {
      alert('No tienes permisos para agregar o editar citas');
      cerrarModal();
      return;
    }

    const datos = {
      email: document.getElementById('inputEmail').value,
      especialidad: document.getElementById('inputTipoExamen').value,
      fechaCita: document.getElementById('inputFecha').value,
      horario: document.getElementById('inputHorario').value,
      motivoCita: document.getElementById('inputMotivo').value,
      estado: document.getElementById('inputEstado').value
    };

    try {
      if (citaEditando) {
        await actualizarCita(citaEditando._id, datos);
        alert('Cita actualizada correctamente');
      } else {
        await crearCita(datos);
        alert('Cita creada correctamente');
      }

      cerrarModal();
      await cargarCitas();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  // ============================================
  // FUNCIONES DE ACCIONES
  // ============================================
  window.verCita = function(id) {
    const cita = todasLasCitas.find(c => c._id === id);
    if (cita) {
      const nombrePaciente = cita.paciente && cita.paciente.nombres && cita.paciente.apellidos
        ? `${cita.paciente.nombres} ${cita.paciente.apellidos}`
        : cita.paciente && cita.paciente.nombres
        ? cita.paciente.nombres
        : 'N/A';
      
      alert(`Detalles de la cita:\n\nPaciente: ${nombrePaciente}\nEmail: ${cita.email}\nTipo: ${cita.especialidad}\nFecha: ${new Date(cita.fechaCita).toLocaleDateString()}\nHorario: ${cita.horario}\nMotivo: ${cita.motivoCita}\nEstado: ${cita.estado || 'pendiente'}`);
    }
  };

  window.editarCita = function(id) {
    // Verificar si el usuario es médico
    const userCargo = sessionStorage.getItem("userCargo");
    if (userCargo === "medico") {
      alert('No tienes permisos para editar citas');
      return;
    }
    
    const cita = todasLasCitas.find(c => c._id === id);
    if (cita) {
      abrirModal(true, cita);
    }
  };

  window.eliminarCitaConfirm = async function(id) {
    // Verificar si el usuario es médico
    const userCargo = sessionStorage.getItem("userCargo");
    if (userCargo === "medico") {
      alert('No tienes permisos para eliminar citas');
      return;
    }
    
    if (!confirm('¿Está seguro de eliminar esta cita?')) {
      return;
    }

    try {
      await eliminarCita(id);
      alert('Cita eliminada correctamente');
      await cargarCitas();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ============================================
  // FUNCIONES DEL CALENDARIO
  // ============================================
  function actualizarCalendario() {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    
    mesActual.textContent = fechaActual.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay();
    const diaAjustado = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1; // Lunes = 0

    calendarGrid.innerHTML = '';

    // Días del mes anterior
    const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();
    for (let i = diaAjustado - 1; i >= 0; i--) {
      const dia = ultimoDiaMesAnterior - i;
      const diaElement = crearDiaCalendario(dia, mes - 1, año, true);
      calendarGrid.appendChild(diaElement);
    }

    // Días del mes actual
    const hoy = new Date();
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const diaFecha = new Date(año, mes, dia);
      const esHoy = diaFecha.toDateString() === hoy.toDateString();
      const tieneCitas = citasFiltradas.some(cita => {
        const fechaCita = new Date(cita.fechaCita);
        return fechaCita.toDateString() === diaFecha.toDateString();
      });

      const diaElement = crearDiaCalendario(dia, mes, año, false, esHoy, tieneCitas);
      calendarGrid.appendChild(diaElement);
    }

    // Días del mes siguiente para completar la cuadrícula
    const totalCeldas = Math.ceil((diasEnMes + diaAjustado) / 7) * 7;
    const diasRestantes = totalCeldas - (diasEnMes + diaAjustado);
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const diaElement = crearDiaCalendario(dia, mes + 1, año, true);
      calendarGrid.appendChild(diaElement);
    }
  }

  function crearDiaCalendario(dia, mes, año, otroMes, esHoy = false, tieneCitas = false) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    
    if (otroMes) {
      div.classList.add('other-month');
    }
    if (esHoy) {
      div.classList.add('today');
    }
    if (tieneCitas) {
      div.classList.add('has-appointment');
    }

    div.textContent = dia;
    div.addEventListener('click', () => {
      if (!otroMes) {
        const fechaSeleccionada = new Date(año, mes, dia);
        filtroFecha.value = fechaSeleccionada.toISOString().split('T')[0];
        aplicarFiltros();
      }
    });

    return div;
  }

  function cambiarVista(vista) {
    vistaActual = vista;

    if (vista === 'mensual') {
      btnVistaMensual.classList.add('active');
      btnVistaHorario.classList.remove('active');
      vistaMensual.classList.remove('hidden');
      vistaHorario.classList.add('hidden');
    } else {
      btnVistaMensual.classList.remove('active');
      btnVistaHorario.classList.add('active');
      vistaMensual.classList.add('hidden');
      vistaHorario.classList.remove('hidden');
    }
  }
});


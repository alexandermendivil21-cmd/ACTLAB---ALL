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
  let mapaEmailDNI = {}; // Mapa para convertir email a DNI
  let citaAEliminar = null; // ID de la cita a eliminar (para el modal de confirmación)

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
  const modalExito = document.getElementById('modalExito');
  const btnCerrarModalExito = document.getElementById('btnCerrarModalExito');
  const modalDetallesCita = document.getElementById('modalDetallesCita');
  const btnCerrarModalDetalles = document.getElementById('btnCerrarModalDetalles');
  const btnAceptarDetalles = document.getElementById('btnAceptarDetalles');
  const modalError = document.getElementById('modalError');
  const btnCerrarModalError = document.getElementById('btnCerrarModalError');
  const modalConfirmacion = document.getElementById('modalConfirmacion');
  const btnCancelarConfirmacion = document.getElementById('btnCancelarConfirmacion');
  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
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
  async function init() {
    await cargarMapaEmailDNI();
    await actualizarAvatarUsuarioTopbar();
    cargarCitas();
    setupEventListeners();
    actualizarCalendario();
  }

  // Función para cargar el mapa de email a DNI
  async function cargarMapaEmailDNI() {
    try {
      const response = await fetch('/api/pacientes');
      if (!response.ok) {
        console.warn('No se pudo cargar el mapa de pacientes');
        return;
      }
      const pacientes = await response.json();
      mapaEmailDNI = {};
      pacientes.forEach(paciente => {
        if (paciente.email && paciente.num_documento && paciente.tipo_documento === 'dni') {
          mapaEmailDNI[paciente.email] = paciente.num_documento;
        }
      });
    } catch (error) {
      console.warn('Error al cargar mapa de pacientes:', error);
    }
  }

  // Actualizar avatar del topbar para médicos o técnicos usando su perfil
  async function actualizarAvatarUsuarioTopbar() {
    try {
      const userCargo = sessionStorage.getItem("userCargo");
      const userEmail = sessionStorage.getItem("userEmail");
      if (!userEmail) return;

      let endpoint = null;
      if (userCargo === "medico") {
        endpoint = `/api/perfil-medico?email=${encodeURIComponent(userEmail)}`;
      } else if (userCargo === "tecnico") {
        endpoint = `/api/perfil-tecnico?email=${encodeURIComponent(userEmail)}`;
      } else {
        return; // solo médicos y técnicos usan avatar personalizado aquí
      }

      const res = await fetch(endpoint);
      if (!res.ok) return;
      const perfil = await res.json();

      const topbarAvatar = document.getElementById("topbar-avatar-medico");
      const defaultAvatar = "../assets2/img/avatar-sofia.jpg";
      const avatarUrl = perfil.imagen
        ? `http://localhost:5000${perfil.imagen}`
        : defaultAvatar;

      if (topbarAvatar) {
        topbarAvatar.src = avatarUrl;
        topbarAvatar.onerror = () => {
          topbarAvatar.src = defaultAvatar;
        };
      }
    } catch (error) {
      console.warn("No se pudo actualizar el avatar del usuario en el topbar:", error);
    }
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
    btnCerrarModalExito.addEventListener('click', cerrarModalExito);
    if (btnCerrarModalDetalles) {
      btnCerrarModalDetalles.addEventListener('click', cerrarModalDetalles);
    }
    if (btnAceptarDetalles) {
      btnAceptarDetalles.addEventListener('click', cerrarModalDetalles);
    }
    if (modalDetallesCita) {
      modalDetallesCita.addEventListener('click', (e) => {
        if (e.target === modalDetallesCita) cerrarModalDetalles();
      });
    }
    btnCerrarModalError.addEventListener('click', cerrarModalError);

    // Cerrar modal de confirmación al hacer clic fuera
    if (modalConfirmacion) {
      modalConfirmacion.addEventListener('click', (e) => {
        if (e.target === modalConfirmacion) cerrarModalConfirmacion();
      });
    }

    // Botones del modal de confirmación
    if (btnCancelarConfirmacion) {
      btnCancelarConfirmacion.addEventListener('click', () => {
        citaAEliminar = null;
        cerrarModalConfirmacion();
      });
    }

    if (btnConfirmarEliminar) {
      btnConfirmarEliminar.addEventListener('click', async () => {
        if (!citaAEliminar) {
          cerrarModalConfirmacion();
          return;
        }

        try {
          await eliminarCita(citaAEliminar);
          mostrarModalExito('La cita ha sido eliminada correctamente.', 'Cita eliminada');
          await cargarCitas();
        } catch (error) {
          mostrarModalError(error.message || 'Ha ocurrido un error al eliminar la cita');
        } finally {
          citaAEliminar = null;
          cerrarModalConfirmacion();
        }
      });
    }

    // Validación de DNI en tiempo real
    const inputDNI = document.getElementById('inputDNI');
    if (inputDNI) {
      inputDNI.addEventListener('input', function(e) {
        // Solo permitir números
        this.value = this.value.replace(/[^0-9]/g, '');
        // Limitar a 8 dígitos
        if (this.value.length > 8) {
          this.value = this.value.slice(0, 8);
        }
      });
    }

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
    
    // Cerrar modal de éxito al hacer clic fuera
    modalExito.addEventListener('click', (e) => {
      if (e.target === modalExito) cerrarModalExito();
    });
    
    // Cerrar modal de error al hacer clic fuera
    modalError.addEventListener('click', (e) => {
      if (e.target === modalError) cerrarModalError();
    });
  }

  // ============================================
  // FUNCIONES DE API
  // ============================================
  async function cargarCitas() {
    try {
      // Asegurar que el mapa de email a DNI esté actualizado
      if (Object.keys(mapaEmailDNI).length === 0) {
        await cargarMapaEmailDNI();
      }
      
      // Obtener información del usuario desde sessionStorage
      const userCargo = sessionStorage.getItem("userCargo");
      const userEmail = sessionStorage.getItem("userEmail");
      
      // Construir URL con parámetros de query
      let url = '/api/admin/citas';
      const params = new URLSearchParams();
      
      // Si es médico o técnico, enviar información para filtrar
      if (userCargo === "medico" || userCargo === "tecnico") {
        params.append('userCargo', userCargo);
        if (userEmail) {
          params.append('userEmail', userEmail);
        }
        url += '?' + params.toString();
      }
      
      // Endpoint para admin: obtener todas las citas sin filtrar por email
      // Para médicos y técnicos: obtener citas filtradas según su cargo y especialidad
      const response = await fetch(url);
      
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
        const emailMatch = cita.email && cita.email.toLowerCase().includes(pacienteFiltro);
        const dniMatch = cita.email && mapaEmailDNI[cita.email] && 
          mapaEmailDNI[cita.email].includes(pacienteFiltro);
        const nombreMatch = cita.paciente && cita.paciente.nombres && 
          cita.paciente.nombres.toLowerCase().includes(pacienteFiltro);
        const apellidoMatch = cita.paciente && cita.paciente.apellidos && 
          cita.paciente.apellidos.toLowerCase().includes(pacienteFiltro);
        const nombreCompleto = cita.paciente && cita.paciente.nombres && cita.paciente.apellidos
          ? `${cita.paciente.nombres} ${cita.paciente.apellidos}`.toLowerCase()
          : '';
        const nombreCompletoMatch = nombreCompleto.includes(pacienteFiltro);
        
        return emailMatch || dniMatch || nombreMatch || apellidoMatch || nombreCompletoMatch;
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

        // Obtener DNI del paciente
        const dniPaciente = cita.email && mapaEmailDNI[cita.email] 
          ? mapaEmailDNI[cita.email] 
          : 'N/A';

        // Obtener motivo de la cita
        const motivoCita = cita.motivoCita || 'N/A';

        return `
          <tr>
            <td>${fechaFormateada} ${horaFormateada}</td>
            <td>${nombrePaciente}</td>
            <td>${dniPaciente}</td>
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
      // Buscar el DNI del paciente a partir del email
      if (cita.email) {
        buscarDNIPorEmail(cita.email).then(dni => {
          if (dni) {
            document.getElementById('inputDNI').value = dni;
          }
        }).catch(() => {
          // Si no se encuentra, dejar vacío
          document.getElementById('inputDNI').value = '';
        });
      } else {
        document.getElementById('inputDNI').value = '';
      }
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

  function mostrarModalExito(mensaje, titulo) {
    const mensajeElement = document.getElementById('modalExitoMensaje');
    const tituloElement = document.getElementById('modalExitoTituloCita');

    if (mensajeElement) {
      mensajeElement.textContent = mensaje;
    }

    if (tituloElement) {
      tituloElement.textContent = titulo || '¡Cita Agendada Exitosamente!';
    }

    modalExito.classList.remove('hidden');
  }

  function cerrarModalExito() {
    modalExito.classList.add('hidden');
  }

  function mostrarModalConfirmacion(mensaje) {
    const mensajeElement = document.getElementById('modalConfirmacionMensaje');
    if (mensajeElement) {
      mensajeElement.textContent = mensaje;
    }
    if (modalConfirmacion) {
      modalConfirmacion.classList.remove('hidden');
    }
  }

  function cerrarModalConfirmacion() {
    if (modalConfirmacion) {
      modalConfirmacion.classList.add('hidden');
    }
  }

  function mostrarModalError(mensaje) {
    const mensajeElement = document.getElementById('modalErrorMensaje');
    if (mensajeElement) {
      mensajeElement.textContent = mensaje;
    }
    modalError.classList.remove('hidden');
  }

  function cerrarModalError() {
    modalError.classList.add('hidden');
  }

  // Función para buscar paciente por DNI y obtener su email
  async function buscarEmailPorDNI(dni) {
    try {
      const response = await fetch('/api/pacientes');
      if (!response.ok) {
        throw new Error('Error al obtener lista de pacientes');
      }
      const pacientes = await response.json();
      const paciente = pacientes.find(p => p.num_documento === dni && p.tipo_documento === 'dni');
      if (!paciente) {
        throw new Error('No se encontró un paciente con ese DNI');
      }
      return paciente.email;
    } catch (error) {
      throw error;
    }
  }

  // Función para buscar DNI por email (para edición)
  async function buscarDNIPorEmail(email) {
    try {
      const response = await fetch('/api/pacientes');
      if (!response.ok) {
        throw new Error('Error al obtener lista de pacientes');
      }
      const pacientes = await response.json();
      const paciente = pacientes.find(p => p.email === email);
      if (!paciente) {
        return null;
      }
      return paciente.num_documento;
    } catch (error) {
      return null;
    }
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

    const dni = document.getElementById('inputDNI').value.trim();
    
    // Validar DNI
    if (!dni || !/^\d{8}$/.test(dni)) {
      mostrarModalError('Por favor, ingrese un DNI válido (8 dígitos)');
      return;
    }

    try {
      // Buscar el email del paciente por DNI
      const email = await buscarEmailPorDNI(dni);

      const datos = {
        email: email,
        especialidad: document.getElementById('inputTipoExamen').value,
        fechaCita: document.getElementById('inputFecha').value,
        horario: document.getElementById('inputHorario').value,
        motivoCita: document.getElementById('inputMotivo').value,
        estado: document.getElementById('inputEstado').value
      };

      if (citaEditando) {
        await actualizarCita(citaEditando._id, datos);
        mostrarModalExito('Cita actualizada correctamente', 'Cita actualizada');
      } else {
        await crearCita(datos);
        mostrarModalExito('La cita ha sido agendada exitosamente', '¡Cita Agendada Exitosamente!');
      }

      cerrarModal();
      await cargarCitas();
    } catch (error) {
      // Mostrar modal de error con el mensaje específico
      mostrarModalError(error.message || 'Ha ocurrido un error al procesar la solicitud');
    }
  }

  // ============================================
  // FUNCIONES DE ACCIONES
  // ============================================
  // Función para ver historial médico desde citas
  window.verHistorialMedicoCita = function(email) {
    if (!email || email === 'N/A') {
      alert('No se encontró el email del paciente');
      return;
    }
    verHistorialMedico({ email: email });
  };

  // Función para mostrar historial médico
  async function verHistorialMedico(paciente) {
    if (!paciente.email) {
      alert("No se encontró el email del paciente");
      return;
    }

    // Crear modal de carga
    const viewModal = document.createElement("div");
    viewModal.className = "modal";
    viewModal.innerHTML = `
      <div class="modal-content modal-view" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>Historial Médico - ${paciente.email}</h3>
          <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body" id="historial-modal-body" style="padding: 1.5rem;">
          <div style="text-align: center; padding: 2rem;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #6c757d;"></i>
            <p>Cargando historial médico...</p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(viewModal);

    try {
      // Obtener historial médico
      const res = await fetch(`http://localhost:5000/api/pacientes/historial?email=${encodeURIComponent(paciente.email)}`);
      if (!res.ok) {
        throw new Error("Error al obtener el historial médico");
      }

      const data = await res.json();
      const { historial, paciente: infoPaciente, resumen } = data;

      const historialBody = document.getElementById("historial-modal-body");
      if (!historialBody) return;

      if (!historial || historial.length === 0) {
        historialBody.innerHTML = `
          <div style="text-align: center; padding: 3rem; color: #6c757d;">
            <i class="fa-solid fa-clipboard-list" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <h4 style="margin-bottom: 0.5rem;">No hay historial médico disponible</h4>
            <p>Este paciente aún no tiene citas, diagnósticos o resultados registrados.</p>
          </div>
        `;
        return;
      }

      // Construir historial con diseño de tarjetas
      let historialHTML = `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <h4 style="margin: 0;">Información del Paciente</h4>
            <button onclick="window.verPerfilPaciente('${paciente.email}')" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #1976d2; color: white; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#1565c0'" onmouseout="this.style.background='#1976d2'">
              <i class="fa-solid fa-user"></i>
              Ver Perfil
            </button>
          </div>
          <p style="margin: 0.25rem 0;"><strong>Nombre:</strong> ${infoPaciente?.nombres || 'N/A'} ${infoPaciente?.apellidos || ''}</p>
          <p style="margin: 0.25rem 0;"><strong>Edad:</strong> ${infoPaciente?.edad || 'N/A'} años</p>
          <p style="margin: 0.25rem 0;"><strong>Email:</strong> ${paciente.email}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
      `;

      historial.forEach((evento) => {
        if (evento.tipo === "resultado") {
          // Tarjeta para resultados de análisis
          const fechaObj = new Date(evento.fecha);
          const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          
          // Colores y iconos para resultados
          const bordeColor = "#8b5cf6"; // Morado para resultados
          const icono = "fa-vials";
          const iconoColor = "#8b5cf6";
          
          // Determinar color del estado
          const estadoLower = (evento.estado || "disponible").toLowerCase();
          let estadoColor = "#22c55e"; // Verde por defecto (disponible)
          let estadoBgColor = "#d1fae5";
          
          if (estadoLower === "pendiente") {
            estadoColor = "#f59e0b"; // Amarillo/Naranja
            estadoBgColor = "#fef3c7";
          } else if (estadoLower === "procesando") {
            estadoColor = "#2e86de"; // Azul
            estadoBgColor = "#dbeafe";
          }
          
          historialHTML += `
            <div style="background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; border-left: 4px solid ${bordeColor};">
              <div style="padding: 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${iconoColor}20; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid ${icono}" style="color: ${iconoColor}; font-size: 1.25rem;"></i>
                  </div>
                  <h3 style="margin: 0; color: ${iconoColor}; font-size: 1.1rem; font-weight: 700;">Resultado de Análisis</h3>
                </div>
                <p style="margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.9rem;">${evento.tipoExamen || 'N/A'} - ${fechaFormateada}</p>
                <p style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1rem; font-weight: 500;">Análisis</p>
                ${evento.observaciones ? `
                  <p style="margin: 0 0 1rem 0; color: #6b7280; font-size: 0.9rem;">${evento.observaciones}</p>
                ` : ''}
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  <span style="display: inline-block; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; background: ${estadoBgColor}; color: ${estadoColor}; text-transform: capitalize;">
                    ${estadoLower}
                  </span>
                  ${evento.archivoPDF ? `
                    <a href="http://localhost:5000${evento.archivoPDF}" target="_blank" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; background: #1976d2; color: white; text-decoration: none; transition: background 0.2s;">
                      <i class="fa-solid fa-file-pdf"></i>
                      Ver resultado completo
                    </a>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        } else if (evento.tipo === "cita") {
          // Determinar si es consulta médica o análisis
          const esAnalisis = evento.motivoCita && evento.motivoCita.includes("Análisis");
          const esConsultaMedica = evento.motivoCita && evento.motivoCita.includes("Consulta");
          
          // Colores y iconos según el tipo
          const bordeColor = esAnalisis ? "#f59e0b" : "#2e86de"; // Naranja para análisis, azul para consulta
          const icono = esAnalisis ? "fa-flask" : "fa-calendar-check";
          const iconoColor = esAnalisis ? "#f59e0b" : "#2e86de";
          
          // Formatear fecha
          const fechaObj = new Date(evento.fecha);
          const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          
          // Usar el horario directamente del evento (ya viene formateado)
          const horarioCompleto = evento.horario || '';
          
          // Determinar color del estado
          const estadoLower = (evento.estado || "pendiente").toLowerCase();
          let estadoColor = "#f59e0b"; // Amarillo por defecto (Pendiente)
          let estadoBgColor = "#fef3c7";
          
          if (estadoLower === "completada") {
            estadoColor = "#22c55e"; // Verde
            estadoBgColor = "#d1fae5";
          } else if (estadoLower === "pendiente") {
            estadoColor = "#f59e0b"; // Amarillo/Naranja
            estadoBgColor = "#fef3c7";
          } else if (estadoLower === "cancelada") {
            estadoColor = "#dc2626"; // Rojo
            estadoBgColor = "#fee2e2";
          }
          
          // Título de la cita
          const tituloCita = esAnalisis ? "Cita - Análisis" : "Cita - Consulta Médica";
          const motivoTexto = esAnalisis ? "Análisis" : "Consulta Médica";
          
          // Información de la especialidad y fecha
          const especialidadTexto = evento.especialidad || 'N/A';
          const subtitulo = `${especialidadTexto} - ${fechaFormateada} ${horarioCompleto}`;
          
          // Verificar si hay diagnósticos y resultados relacionados
          const tieneDiagnosticos = evento.diagnosticos && evento.diagnosticos.length > 0;
          const tieneResultados = evento.resultados && evento.resultados.length > 0;
          
          historialHTML += `
            <div style="background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; border-left: 4px solid ${bordeColor};">
              <div style="padding: 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${iconoColor}20; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid ${icono}" style="color: ${iconoColor}; font-size: 1.25rem;"></i>
                  </div>
                  <h3 style="margin: 0; color: ${iconoColor}; font-size: 1.1rem; font-weight: 700;">${tituloCita}</h3>
                </div>
                <p style="margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.9rem;">${subtitulo}</p>
                <p style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1rem; font-weight: 500;">${motivoTexto}</p>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="display: inline-block; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; background: ${estadoBgColor}; color: ${estadoColor}; text-transform: capitalize;">
                    ${estadoLower}
                  </span>
                </div>
              </div>
              ${tieneDiagnosticos ? `
                <div style="border-top: 1px solid #e5e7eb; padding: 1.25rem; background: #f9fafb;">
                  <h4 style="margin: 0 0 1rem 0; font-size: 1rem; color: #1976d2; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-user-doctor"></i>
                    Consultas médicas relacionadas (${evento.diagnosticos.length})
                  </h4>
                  ${evento.diagnosticos.map((diag) => {
                    const fechaDiag = new Date(diag.fecha).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });
                    return `
                      <div style="margin-bottom: ${evento.diagnosticos.indexOf(diag) < evento.diagnosticos.length - 1 ? '1rem' : '0'}; padding: 1rem; background: #fff; border-radius: 8px; border-left: 3px solid #1976d2;">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
                          ${diag.medico ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #374151; min-width: 100px;">Médico:</strong>
                              <span style="color: #6b7280;">${diag.medico}</span>
                            </div>
                          ` : ''}
                          ${diag.especialidad ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #374151; min-width: 100px;">Especialidad:</strong>
                              <span style="color: #6b7280;">${diag.especialidad}</span>
                            </div>
                          ` : ''}
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #374151; min-width: 100px;">Fecha:</strong>
                            <span style="color: #6b7280;">${fechaDiag}</span>
                          </div>
                          ${diag.diagnostico ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #374151; min-width: 100px;">Diagnóstico:</strong>
                              <span style="color: #6b7280;">${diag.diagnostico}</span>
                            </div>
                          ` : ''}
                          ${diag.sintomas ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #374151; min-width: 100px;">Síntomas:</strong>
                              <span style="color: #6b7280;">${diag.sintomas}</span>
                            </div>
                          ` : ''}
                          ${diag.observaciones ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #374151; min-width: 100px;">Observaciones:</strong>
                              <span style="color: #6b7280;">${diag.observaciones}</span>
                            </div>
                          ` : ''}
                          ${diag.tieneReceta && diag.receta && diag.receta.length > 0 ? `
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
                              <strong style="color: #374151; display: block; margin-bottom: 0.5rem;">Medicación prescrita:</strong>
                              <ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">
                                ${diag.receta.map(med => `
                                  <li style="margin: 0.25rem 0;">${med.nombre} - ${med.dosis} (${med.frecuencia}) por ${med.duracion}</li>
                                `).join('')}
                              </ul>
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
              ${tieneResultados ? `
                <div style="border-top: 1px solid #e5e7eb; padding: 1.25rem; background: #f9fafb;">
                  <h4 style="margin: 0 0 1rem 0; font-size: 1rem; color: #8b5cf6; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-vials"></i>
                    Resultados de análisis relacionados (${evento.resultados.length})
                  </h4>
                  ${evento.resultados.map((res, idx) => {
                    const fechaRes = new Date(res.fecha).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });
                    return `
                      <div style="margin-bottom: ${idx < evento.resultados.length - 1 ? '1rem' : '0'}; padding: 1rem; background: #fff; border-radius: 8px; border-left: 3px solid #8b5cf6;">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #374151; min-width: 100px;">Tipo de examen:</strong>
                            <span style="color: #6b7280;">${res.tipoExamen || 'N/A'}</span>
                          </div>
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #374151; min-width: 100px;">Fecha:</strong>
                            <span style="color: #6b7280;">${fechaRes}</span>
                          </div>
                          ${res.observaciones ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #374151; min-width: 100px;">Observaciones:</strong>
                              <span style="color: #6b7280;">${res.observaciones}</span>
                            </div>
                          ` : ''}
                          ${res.archivoPDF ? `
                            <div style="margin-top: 0.5rem;">
                              <a href="http://localhost:5000${res.archivoPDF}" target="_blank" style="display: inline-flex; align-items: center; gap: 0.4rem; color: #8b5cf6; text-decoration: none; font-weight: 500; cursor: pointer;">
                                <i class="fa-solid fa-file-pdf"></i> Ver resultado completo
                              </a>
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }
      });

      historialHTML += `</div>`;
      historialBody.innerHTML = historialHTML;

    } catch (error) {
      console.error("Error al cargar historial médico:", error);
      const historialBody = document.getElementById("historial-modal-body");
      if (historialBody) {
        historialBody.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #dc2626;">
            <i class="fa-solid fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">Error al cargar el historial</h4>
            <p>${error.message || "No se pudo cargar el historial médico del paciente."}</p>
          </div>
        `;
      }
    }
  }

  // Función global para ver el perfil del paciente
  window.verPerfilPaciente = async function(email) {
    if (!email) {
      alert("No se encontró el email del paciente");
      return;
    }

    // Crear modal de perfil
    const perfilModal = document.createElement("div");
    perfilModal.className = "modal";
    perfilModal.innerHTML = `
      <div class="modal-content modal-view" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>Perfil del Paciente</h3>
          <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body" id="perfil-paciente-body" style="padding: 1.5rem;">
          <div style="text-align: center; padding: 2rem;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #6c757d;"></i>
            <p>Cargando perfil del paciente...</p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(perfilModal);

    try {
      // Obtener perfil del paciente
      const res = await fetch(`http://localhost:5000/api/perfil?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        throw new Error("Error al obtener el perfil del paciente");
      }

      const perfil = await res.json();
      const perfilBody = document.getElementById("perfil-paciente-body");
      if (!perfilBody) return;

      // Formatear género
      const generoFormateado = perfil.genero 
        ? perfil.genero.charAt(0).toUpperCase() + perfil.genero.slice(1).replace(/-/g, ' ')
        : "No especificado";

      // Formatear tipo de documento
      const tipoDocFormateado = perfil.tipo_documento 
        ? perfil.tipo_documento.toUpperCase().replace(/-/g, ' ')
        : "No especificado";

      // Obtener URL de imagen
      const imagenUrl = perfil.imagen 
        ? `http://localhost:5000${perfil.imagen}`
        : '../assets2/img/avatar-sofia.jpg';

      perfilBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <img src="${imagenUrl}" alt="Foto de perfil" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #1976d2; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" onerror="this.src='../assets2/img/avatar-sofia.jpg'">
          <h2 style="margin: 1rem 0 0.5rem 0; color: #1a1a1a; font-size: 1.5rem;">${perfil.nombres || ''} ${perfil.apellidos || ''}</h2>
          <p style="color: #6b7280; margin: 0;">Paciente</p>
        </div>

        <div style="display: grid; gap: 1.5rem;">
          <div style="padding: 1.25rem; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 1rem 0; color: #1976d2; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-id-card"></i>
              Información Personal
            </h4>
            <div style="display: grid; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Edad:</strong>
                <span style="color: #6b7280;">${perfil.edad || 'No especificado'} ${perfil.edad ? 'años' : ''}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Género:</strong>
                <span style="color: #6b7280;">${generoFormateado}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <strong style="color: #374151;">Tipo de Documento:</strong>
                <span style="color: #6b7280;">${tipoDocFormateado}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid #e5e7eb; margin-top: 0.75rem;">
                <strong style="color: #374151;">Número de Documento:</strong>
                <span style="color: #6b7280;">${perfil.num_documento || 'No especificado'}</span>
              </div>
            </div>
          </div>

          <div style="padding: 1.25rem; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 1rem 0; color: #1976d2; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-address-book"></i>
              Información de Contacto
            </h4>
            <div style="display: grid; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Email:</strong>
                <span style="color: #6b7280;">${perfil.email || 'No especificado'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Celular:</strong>
                <span style="color: #6b7280;">${perfil.celular || 'No especificado'}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <strong style="color: #374151;">Dirección:</strong>
                <span style="color: #6b7280; text-align: right; max-width: 60%;">${perfil.direccion || 'No especificado'}</span>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top: 1.5rem; text-align: center;">
          <button onclick="window.verInformacionMedica('${email}')" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
            <i class="fa-solid fa-heart-pulse"></i>
            Información Médica Básica
          </button>
        </div>
      `;

    } catch (error) {
      console.error("Error al cargar perfil del paciente:", error);
      const perfilBody = document.getElementById("perfil-paciente-body");
      if (perfilBody) {
        perfilBody.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #dc2626;">
            <i class="fa-solid fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">Error al cargar el perfil</h4>
            <p>${error.message || "No se pudo cargar el perfil del paciente."}</p>
          </div>
        `;
      }
    }
  };

  // Función global para ver información médica básica
  window.verInformacionMedica = async function(email) {
    if (!email) {
      alert("No se encontró el email del paciente");
      return;
    }

    // Crear modal de información médica
    const infoMedicaModal = document.createElement("div");
    infoMedicaModal.className = "modal";
    infoMedicaModal.innerHTML = `
      <div class="modal-content modal-view" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>Información Médica Básica</h3>
          <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body" id="info-medica-body" style="padding: 1.5rem;">
          <div style="text-align: center; padding: 2rem;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #6c757d;"></i>
            <p>Cargando información médica...</p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
          <button type="button" id="btn-editar-info-medica" class="btn-primary" style="display: none;">
            <i class="fa-solid fa-pencil"></i> Editar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(infoMedicaModal);

    try {
      // Obtener perfil del paciente con información médica
      const res = await fetch(`http://localhost:5000/api/perfil?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        throw new Error("Error al obtener el perfil del paciente");
      }

      const perfil = await res.json();
      const infoMedicaBody = document.getElementById("info-medica-body");
      if (!infoMedicaBody) return;

      const infoMedica = perfil.informacionMedica || {};
      const alergias = infoMedica.alergias || [];
      const medicamentos = infoMedica.medicamentosActuales || [];
      const condiciones = infoMedica.condicionesMedicas || [];
      const grupoSanguineo = infoMedica.grupoSanguineo || '';
      const contactoEmergencia = infoMedica.contactoEmergencia || {};
      const notasMedicas = infoMedica.notasMedicas || '';

      infoMedicaBody.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
          <div style="padding: 1.25rem; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
            <h4 style="margin: 0 0 1rem 0; color: #dc2626; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Alergias
            </h4>
            ${alergias.length > 0 ? `
              <ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">
                ${alergias.map(alergia => `<li style="margin: 0.5rem 0;">${alergia}</li>`).join('')}
              </ul>
            ` : '<p style="color: #9ca3af; margin: 0;">No se han registrado alergias</p>'}
          </div>

          <div style="padding: 1.25rem; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h4 style="margin: 0 0 1rem 0; color: #2563eb; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-pills"></i>
              Medicamentos Actuales
            </h4>
            ${medicamentos.length > 0 ? `
              <ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">
                ${medicamentos.map(med => `<li style="margin: 0.5rem 0;">${med}</li>`).join('')}
              </ul>
            ` : '<p style="color: #9ca3af; margin: 0;">No se han registrado medicamentos actuales</p>'}
          </div>

          <div style="padding: 1.25rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h4 style="margin: 0 0 1rem 0; color: #d97706; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-file-medical"></i>
              Condiciones Médicas
            </h4>
            ${condiciones.length > 0 ? `
              <ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">
                ${condiciones.map(cond => `<li style="margin: 0.5rem 0;">${cond}</li>`).join('')}
              </ul>
            ` : '<p style="color: #9ca3af; margin: 0;">No se han registrado condiciones médicas</p>'}
          </div>

          <div style="padding: 1.25rem; background: #f8f9fa; border-radius: 8px;">
            <h4 style="margin: 0 0 1rem 0; color: #1976d2; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-info-circle"></i>
              Información Adicional
            </h4>
            <div style="display: grid; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Grupo Sanguíneo:</strong>
                <span style="color: #6b7280;">${grupoSanguineo || 'No especificado'}</span>
              </div>
              ${contactoEmergencia.nombre ? `
                <div style="padding-top: 0.75rem; border-top: 1px solid #e5e7eb; margin-top: 0.75rem;">
                  <h5 style="margin: 0 0 0.75rem 0; color: #374151; font-size: 0.95rem; font-weight: 600;">Contacto de Emergencia</h5>
                  <div style="display: grid; gap: 0.5rem; font-size: 0.9rem;">
                    <div style="display: flex; justify-content: space-between;">
                      <strong style="color: #374151;">Nombre:</strong>
                      <span style="color: #6b7280;">${contactoEmergencia.nombre}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <strong style="color: #374151;">Relación:</strong>
                      <span style="color: #6b7280;">${contactoEmergencia.relacion || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <strong style="color: #374151;">Teléfono:</strong>
                      <span style="color: #6b7280;">${contactoEmergencia.telefono || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ` : ''}
              ${notasMedicas ? `
                <div style="padding-top: 0.75rem; border-top: 1px solid #e5e7eb; margin-top: 0.75rem;">
                  <h5 style="margin: 0 0 0.5rem 0; color: #374151; font-size: 0.95rem; font-weight: 600;">Notas Médicas</h5>
                  <p style="color: #6b7280; margin: 0; white-space: pre-wrap;">${notasMedicas}</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      // Mostrar botón de editar
      const btnEditar = document.getElementById("btn-editar-info-medica");
      if (btnEditar) {
        btnEditar.style.display = "inline-flex";
        btnEditar.onclick = () => {
          infoMedicaModal.remove();
          window.editarInformacionMedica(email);
        };
      }

    } catch (error) {
      console.error("Error al cargar información médica:", error);
      const infoMedicaBody = document.getElementById("info-medica-body");
      if (infoMedicaBody) {
        infoMedicaBody.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #dc2626;">
            <i class="fa-solid fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">Error al cargar la información médica</h4>
            <p>${error.message || "No se pudo cargar la información médica del paciente."}</p>
          </div>
        `;
      }
    }
  };

  // Función global para editar información médica básica
  window.editarInformacionMedica = async function(email) {
    if (!email) {
      alert("No se encontró el email del paciente");
      return;
    }

    // Obtener información actual
    let infoMedica = {};
    try {
      const res = await fetch(`http://localhost:5000/api/perfil?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const perfil = await res.json();
        infoMedica = perfil.informacionMedica || {};
      }
    } catch (error) {
      console.warn("Error al cargar información médica:", error);
    }

    // Crear modal de edición
    const editModal = document.createElement("div");
    editModal.className = "modal";
    editModal.innerHTML = `
      <div class="modal-content modal-view" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>Editar Información Médica Básica</h3>
          <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <form id="form-info-medica">
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Alergias (separadas por comas)</label>
              <textarea id="input-alergias" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;" placeholder="Ej: Penicilina, Polen, Látex">${(infoMedica.alergias || []).join(', ')}</textarea>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Medicamentos Actuales (separados por comas)</label>
              <textarea id="input-medicamentos" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;" placeholder="Ej: Metformina 500mg, Aspirina 100mg">${(infoMedica.medicamentosActuales || []).join(', ')}</textarea>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Condiciones Médicas (separadas por comas)</label>
              <textarea id="input-condiciones" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;" placeholder="Ej: Diabetes tipo 2, Hipertensión">${(infoMedica.condicionesMedicas || []).join(', ')}</textarea>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Grupo Sanguíneo</label>
              <select id="input-grupo-sanguineo" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;">
                <option value="">Seleccione</option>
                <option value="A+" ${infoMedica.grupoSanguineo === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${infoMedica.grupoSanguineo === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${infoMedica.grupoSanguineo === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${infoMedica.grupoSanguineo === 'B-' ? 'selected' : ''}>B-</option>
                <option value="AB+" ${infoMedica.grupoSanguineo === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${infoMedica.grupoSanguineo === 'AB-' ? 'selected' : ''}>AB-</option>
                <option value="O+" ${infoMedica.grupoSanguineo === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${infoMedica.grupoSanguineo === 'O-' ? 'selected' : ''}>O-</option>
              </select>
            </div>

            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
              <h4 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; color: #374151;">Contacto de Emergencia</h4>
              <div style="display: grid; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Nombre</label>
                  <input type="text" id="input-contacto-nombre" value="${infoMedica.contactoEmergencia?.nombre || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;" placeholder="Nombre completo">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Relación</label>
                    <input type="text" id="input-contacto-relacion" value="${infoMedica.contactoEmergencia?.relacion || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;" placeholder="Ej: Esposo/a, Padre, etc.">
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Teléfono</label>
                    <input type="text" id="input-contacto-telefono" value="${infoMedica.contactoEmergencia?.telefono || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;" placeholder="9 dígitos">
                  </div>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Notas Médicas</label>
              <textarea id="input-notas" rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;" placeholder="Notas adicionales sobre el paciente...">${infoMedica.notasMedicas || ''}</textarea>
            </div>
          </form>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
          <button type="button" id="btn-guardar-info-medica" class="btn-primary">
            <i class="fa-solid fa-save"></i> Guardar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(editModal);

    // Manejar guardado
    document.getElementById("btn-guardar-info-medica").onclick = async () => {
      const alergiasText = document.getElementById("input-alergias").value.trim();
      const medicamentosText = document.getElementById("input-medicamentos").value.trim();
      const condicionesText = document.getElementById("input-condiciones").value.trim();
      
      const alergias = alergiasText ? alergiasText.split(',').map(a => a.trim()).filter(a => a) : [];
      const medicamentos = medicamentosText ? medicamentosText.split(',').map(m => m.trim()).filter(m => m) : [];
      const condiciones = condicionesText ? condicionesText.split(',').map(c => c.trim()).filter(c => c) : [];

      const datos = {
        informacionMedica: {
          alergias,
          medicamentosActuales: medicamentos,
          condicionesMedicas: condiciones,
          grupoSanguineo: document.getElementById("input-grupo-sanguineo").value,
          contactoEmergencia: {
            nombre: document.getElementById("input-contacto-nombre").value.trim(),
            relacion: document.getElementById("input-contacto-relacion").value.trim(),
            telefono: document.getElementById("input-contacto-telefono").value.trim(),
          },
          notasMedicas: document.getElementById("input-notas").value.trim(),
        }
      };

      try {
        const res = await fetch(`http://localhost:5000/api/pacientes/info-medica?email=${encodeURIComponent(email)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al guardar la información médica");
        }

        alert("Información médica guardada correctamente");
        editModal.remove();
        window.verInformacionMedica(email);
      } catch (error) {
        console.error("Error al guardar información médica:", error);
        alert(error.message || "No se pudo guardar la información médica");
      }
    };
  };

  function mostrarModalDetalles(cita) {
    const nombrePaciente = cita.paciente && cita.paciente.nombres && cita.paciente.apellidos
      ? `${cita.paciente.nombres} ${cita.paciente.apellidos}`
      : cita.paciente && cita.paciente.nombres
      ? cita.paciente.nombres
      : 'N/A';
    
    const fechaFormateada = new Date(cita.fechaCita).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Obtener DNI del paciente
    const dniPaciente = cita.email && mapaEmailDNI[cita.email] 
      ? mapaEmailDNI[cita.email] 
      : 'N/A';
    
    // Mapear estado a texto legible
    const estadoTexto = {
      'pendiente': 'Pendiente',
      'confirmada': 'Confirmada',
      'completada': 'Completada',
      'cancelada': 'Cancelada'
    };
    const estado = estadoTexto[cita.estado] || cita.estado || 'Pendiente';
    
    // Llenar los campos del modal
    document.getElementById('detallePaciente').textContent = nombrePaciente;
    document.getElementById('detalleDNI').textContent = dniPaciente;
    document.getElementById('detalleTipo').textContent = cita.especialidad || 'N/A';
    document.getElementById('detalleFecha').textContent = fechaFormateada;
    document.getElementById('detalleHorario').textContent = cita.horario || 'N/A';
    document.getElementById('detalleMotivo').textContent = cita.motivoCita || 'N/A';
    
    // Mostrar estado con estilo especial
    const estadoElement = document.getElementById('detalleEstado');
    estadoElement.textContent = estado.toLowerCase();
    estadoElement.className = 'detalle-value estado-' + (cita.estado || 'pendiente');
    
    // Mostrar el modal
    if (modalDetallesCita) {
      modalDetallesCita.classList.remove('hidden');
    }
  }

  function cerrarModalDetalles() {
    if (modalDetallesCita) {
      modalDetallesCita.classList.add('hidden');
    }
  }

  window.verCita = function(id) {
    const cita = todasLasCitas.find(c => c._id === id);
    if (cita) {
      mostrarModalDetalles(cita);
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
      mostrarModalError('No tienes permisos para eliminar citas');
      return;
    }

    citaAEliminar = id;
    mostrarModalConfirmacion('¿Está seguro de eliminar esta cita?');
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

  // Configurar el avatar del topbar para redirigir al perfil según el cargo
  const topbarAvatar = document.getElementById("topbar-avatar-medico");
  if (topbarAvatar) {
    const userCargoTopbar = sessionStorage.getItem("userCargo");
    topbarAvatar.addEventListener("click", () => {
      if (userCargoTopbar === "medico") {
        window.location.href = "/admin/perfil";
      } else if (userCargoTopbar === "tecnico") {
        window.location.href = "/admin/perfil-tecnico";
      } else {
        window.location.href = "/admin";
      }
    });
  }
});


// FRONTEND/public/admin-resultados.js
document.addEventListener('DOMContentLoaded', () => {
  // Variables globales
  let todosLosResultados = [];
  let resultadosFiltrados = [];
  let resultadoEditando = null;
  let todasLasMuestras = [];
  let muestrasCargadas = false; // Bandera para evitar recargas innecesarias
  let userCargo = sessionStorage.getItem('userCargo') || '';
  let citasCargadas = []; // Almacenar las citas cargadas para obtener la especialidad

  // Actualizar avatar del topbar para técnico de laboratorio (si aplica)
  (async () => {
    try {
      const userCargoSesion = sessionStorage.getItem('userCargo');
      const userEmailSesion = sessionStorage.getItem('userEmail');
      if (userCargoSesion !== 'tecnico' || !userEmailSesion) return;

      const res = await fetch(`/api/perfil-tecnico?email=${encodeURIComponent(userEmailSesion)}`);
      if (!res.ok) return;
      const tecnico = await res.json();

      const topbarAvatar = document.getElementById('topbar-avatar-tecnico');
      const defaultAvatar = '../assets2/img/avatar-sofia.jpg';
      const avatarUrl = tecnico.imagen
        ? `http://localhost:5000${tecnico.imagen}`
        : defaultAvatar;

      if (topbarAvatar) {
        topbarAvatar.src = avatarUrl;
        topbarAvatar.onerror = () => {
          topbarAvatar.src = defaultAvatar;
        };
      }
    } catch (error) {
      console.warn('No se pudo actualizar el avatar del técnico en el topbar:', error);
    }
  })();

  // Referencias DOM
  const filtroPaciente = document.getElementById('filtroPaciente');
  const filtroTipoExamen = document.getElementById('filtroTipoExamen');
  const filtroEstado = document.getElementById('filtroEstado');
  const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
  const btnAgregarResultado = document.getElementById('btnAgregarResultado');
  const resultadosBody = document.getElementById('resultadosBody');
  const emptyState = document.getElementById('emptyState');
  const tablaResultados = document.getElementById('tablaResultados');
  const modalResultado = document.getElementById('modalResultado');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const btnCancelar = document.getElementById('btnCancelar');
  const formResultado = document.getElementById('formResultado');
  const inputPDF = document.getElementById('inputPDF');
  const fileName = document.getElementById('fileName');
  const muestrasBody = document.getElementById('muestrasBody');
  const tablaMuestras = document.getElementById('tablaMuestras');
  const emptyStateMuestras = document.getElementById('emptyStateMuestras');
  const btnAgregarMuestra = document.getElementById('btnAgregarMuestra');
  const modalMuestra = document.getElementById('modalMuestra');
  const btnCerrarModalMuestra = document.getElementById('btnCerrarModalMuestra');
  const btnCancelarMuestra = document.getElementById('btnCancelarMuestra');
  const formMuestra = document.getElementById('formMuestra');
  const inputCitaMuestra = document.getElementById('inputCitaMuestra');
  const inputEmailMuestra = document.getElementById('inputEmailMuestra');
  const modalExito = document.getElementById('modalExito');
  const btnCerrarModalExito = document.getElementById('btnCerrarModalExito');
  const modalConfirmacion = document.getElementById('modalConfirmacion');
  const btnCancelarConfirmacion = document.getElementById('btnCancelarConfirmacion');
  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
  const modalError = document.getElementById('modalError');
  const btnCerrarModalError = document.getElementById('btnCerrarModalError');
  let resultadoAEliminar = null;

  // Inicialización
  init();

  // ============================================
  // FUNCIONES DE INICIALIZACIÓN
  // ============================================
  function init() {
    cargarResultados();
    cargarMuestras();
    setupEventListeners();

    // Configurar click en avatar del topbar para ir al perfil del técnico
    const topbarAvatar = document.getElementById('topbar-avatar-tecnico');
    if (topbarAvatar) {
      topbarAvatar.addEventListener('click', () => {
        window.location.href = '/admin/perfil-tecnico';
      });
    }
  }

  function setupEventListeners() {
    // Filtros
    filtroPaciente.addEventListener('input', aplicarFiltros);
    filtroTipoExamen.addEventListener('change', aplicarFiltros);
    filtroEstado.addEventListener('change', aplicarFiltros);
    btnLimpiarFiltros.addEventListener('click', limpiarFiltros);

    // Modal
    btnAgregarResultado.addEventListener('click', () => abrirModal(false));
    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    formResultado.addEventListener('submit', guardarResultado);
    if (btnCerrarModalExito) {
      btnCerrarModalExito.addEventListener('click', cerrarModalExito);
    }
    if (modalExito) {
      modalExito.addEventListener('click', (e) => {
        if (e.target === modalExito) cerrarModalExito();
      });
    }
    if (btnCancelarConfirmacion) {
      btnCancelarConfirmacion.addEventListener('click', cerrarModalConfirmacion);
    }
    if (btnConfirmarEliminar) {
      btnConfirmarEliminar.addEventListener('click', confirmarEliminacion);
    }
    if (modalConfirmacion) {
      modalConfirmacion.addEventListener('click', (e) => {
        if (e.target === modalConfirmacion) cerrarModalConfirmacion();
      });
    }
    if (btnCerrarModalError) {
      btnCerrarModalError.addEventListener('click', cerrarModalError);
    }
    if (modalError) {
      modalError.addEventListener('click', (e) => {
        if (e.target === modalError) cerrarModalError();
      });
    }

    // File input
    inputPDF.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        fileName.textContent = e.target.files[0].name;
      } else {
        fileName.textContent = 'Seleccionar archivo PDF';
      }
    });

    // Cerrar modal al hacer clic fuera
    modalResultado.addEventListener('click', (e) => {
      if (e.target === modalResultado) cerrarModal();
    });

    // Modal de Muestras
    if (btnAgregarMuestra) {
      btnAgregarMuestra.addEventListener('click', () => abrirModalMuestra());
    }
    if (btnCerrarModalMuestra) {
      btnCerrarModalMuestra.addEventListener('click', cerrarModalMuestra);
    }
    if (btnCancelarMuestra) {
      btnCancelarMuestra.addEventListener('click', cerrarModalMuestra);
    }
    if (formMuestra) {
      formMuestra.addEventListener('submit', guardarMuestra);
    }
    if (modalMuestra) {
      modalMuestra.addEventListener('click', (e) => {
        if (e.target === modalMuestra) cerrarModalMuestra();
      });
    }
    if (inputEmailMuestra) {
      inputEmailMuestra.addEventListener('input', cargarCitasPorDNI);
    }
  }

  // ============================================
  // FUNCIONES DE API - MUESTRAS
  // ============================================
  async function crearMuestra(datos) {
    try {
      const response = await fetch('/api/muestras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la muestra');
      }

      const resultado = await response.json();
      return resultado;
    } catch (error) {
      console.error('Error al crear muestra:', error);
      throw error;
    }
  }

  async function cargarCitasPorDNI() {
    const dni = inputEmailMuestra?.value.trim();
    if (!dni || !inputCitaMuestra) return;

    // Validar formato de DNI
    if (!/^\d{8}$/.test(dni)) {
      inputCitaMuestra.innerHTML = '<option value="">Ingrese un DNI válido (8 dígitos)</option>';
      return;
    }

    try {
      // Buscar el email del paciente por DNI
      const email = await buscarEmailPorDNI(dni);
      
      const response = await fetch(`/api/citas?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error('Error al cargar las citas');
      }

      const citas = await response.json();
      
      // Limpiar opciones anteriores excepto la primera
      inputCitaMuestra.innerHTML = '<option value="">Seleccione una cita</option>';

      if (citas.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay citas disponibles para este paciente';
        option.disabled = true;
        inputCitaMuestra.appendChild(option);
        return;
      }

      // Guardar citas para poder obtener la especialidad después
      citasCargadas = citas;
      
      // Agregar citas al selector
      citas.forEach(cita => {
        const fechaCita = new Date(cita.fechaCita);
        const fechaFormateada = fechaCita.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const option = document.createElement('option');
        option.value = cita._id;
        option.textContent = `${fechaFormateada} - ${cita.especialidad || 'N/A'} - ${cita.motivoCita || 'N/A'}`;
        inputCitaMuestra.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar citas:', error);
      inputCitaMuestra.innerHTML = '<option value="">Error: ' + (error.message || 'No se encontró un paciente con ese DNI') + '</option>';
    }
  }

  function abrirModalMuestra() {
    if (!modalMuestra) return;
    
    // Limpiar estado de edición
    muestraEditando = null;
    
    // Limpiar formulario
    if (formMuestra) formMuestra.reset();
    if (inputCitaMuestra) inputCitaMuestra.innerHTML = '<option value="">Seleccione una cita</option>';
    
    // Actualizar título del modal
    const modalTitulo = document.querySelector('#modalMuestra h3');
    if (modalTitulo) modalTitulo.textContent = 'Agregar Nueva Muestra';
    
    // Actualizar botón de guardar
    const iconoBtn = document.getElementById('iconoBtnMuestra');
    const textoBtn = document.getElementById('textoBtnMuestra');
    if (iconoBtn) iconoBtn.className = 'fa-solid fa-plus';
    if (textoBtn) textoBtn.textContent = 'Agregar Muestra';
    
    // Establecer fecha actual por defecto
    const hoy = new Date().toISOString().split('T')[0];
    
    modalMuestra.classList.remove('hidden');
  }

  function cerrarModalMuestra() {
    if (!modalMuestra) return;
    modalMuestra.classList.add('hidden');
    if (formMuestra) formMuestra.reset();
    if (inputCitaMuestra) inputCitaMuestra.innerHTML = '<option value="">Seleccione una cita</option>';
    muestraEditando = null;
  }

  async function guardarMuestra(e) {
    e.preventDefault();

    const dni = inputEmailMuestra?.value.trim();
    const citaId = inputCitaMuestra?.value;
    const tipoMuestra = document.getElementById('inputTipoMuestra')?.value;
    const estadoMuestra = document.getElementById('inputEstadoMuestra')?.value;
    const tecnicoLaboratorio = document.getElementById('inputTecnicoMuestra')?.value.trim();
    const observaciones = document.getElementById('inputObservacionesMuestra')?.value.trim();

    // Validar DNI
    if (!dni || !/^\d{8}$/.test(dni)) {
      mostrarModalError('Por favor, ingrese un DNI válido (8 dígitos)');
      return;
    }

    if (!citaId || !tipoMuestra) {
      mostrarModalError('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      // Buscar el email del paciente por DNI
      const email = await buscarEmailPorDNI(dni);

      // Obtener la especialidad de la cita seleccionada
      const citaSeleccionada = citasCargadas.find(c => c._id === citaId);
      const especialidad = citaSeleccionada ? (citaSeleccionada.especialidad || '') : '';

      const datos = {
        email,
        citaId,
        tipoMuestra,
        estadoMuestra: estadoMuestra || 'pendiente',
        tecnicoLaboratorio: tecnicoLaboratorio || '',
        observaciones: observaciones || '',
        especialidad: especialidad, // Incluir la especialidad
      };

      if (muestraEditando && muestraEditando._id) {
        // Actualizar muestra existente
        const response = await fetch(`/api/muestras/${muestraEditando._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar la muestra');
        }

        // Actualizar la muestra localmente con la especialidad
        const muestraIndex = todasLasMuestras.findIndex(m => m._id === muestraEditando._id);
        if (muestraIndex !== -1) {
          todasLasMuestras[muestraIndex].especialidad = especialidad;
          todasLasMuestras[muestraIndex].citaId = citaId;
          todasLasMuestras[muestraIndex].tipoMuestra = tipoMuestra;
          todasLasMuestras[muestraIndex].estadoMuestra = estadoMuestra || 'pendiente';
          todasLasMuestras[muestraIndex].tecnicoLaboratorio = tecnicoLaboratorio || '';
          todasLasMuestras[muestraIndex].observaciones = observaciones || '';
        }

        mostrarModalExito('Muestra actualizada correctamente');
        muestraEditando = null;
      } else {
        // Crear nueva muestra
        await crearMuestra(datos);
        mostrarModalExito('Muestra creada correctamente');
      }

      cerrarModalMuestra();
      await cargarMuestras(true); // Forzar recarga de muestras
    } catch (error) {
      mostrarModalError(error.message || 'Ha ocurrido un error al procesar la solicitud');
    }
  }
  async function cargarMuestras(forzarRecarga = false) {
    // Evitar recargar si ya están cargadas y no se fuerza la recarga
    if (muestrasCargadas && !forzarRecarga) {
      return;
    }

    try {
      const response = await fetch('/api/muestras');
      
      if (!response.ok) {
        throw new Error('Error al cargar las muestras');
      }

      const data = await response.json();
      todasLasMuestras = Array.isArray(data) ? data : [];
      muestrasCargadas = true;
      renderizarMuestras();
    } catch (error) {
      console.error('Error al cargar muestras:', error);
      todasLasMuestras = [];
      muestrasCargadas = false;
      renderizarMuestras();
    }
  }

  async function actualizarEstadoMuestra(id, estadoMuestra) {
    try {
      const response = await fetch(`/api/muestras/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estadoMuestra: estadoMuestra,
          userCargo: userCargo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el estado de la muestra');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar estado de muestra:', error);
      throw error;
    }
  }

  // ============================================
  // FUNCIONES DE RENDERIZADO - MUESTRAS
  // ============================================
  function renderizarMuestras() {
    if (todasLasMuestras.length === 0) {
      if (tablaMuestras) tablaMuestras.style.display = 'none';
      if (emptyStateMuestras) {
        emptyStateMuestras.classList.remove('hidden');
        emptyStateMuestras.style.display = 'flex';
      }
      if (muestrasBody) {
        muestrasBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
              No hay muestras registradas
            </td>
          </tr>
        `;
      }
      return;
    }

    if (tablaMuestras) tablaMuestras.style.display = 'table';
    if (emptyStateMuestras) {
      emptyStateMuestras.classList.add('hidden');
      emptyStateMuestras.style.display = 'none';
    }

    if (!muestrasBody) return;

    muestrasBody.innerHTML = todasLasMuestras
      .sort((a, b) => {
        const fechaA = new Date(a.fechaRealizacionCita || a.fechaRecoleccion || a.createdAt);
        const fechaB = new Date(b.fechaRealizacionCita || b.fechaRecoleccion || b.createdAt);
        return fechaB - fechaA;
      })
      .map(muestra => {
        const fechaRealizacion = muestra.fechaRealizacionCita 
          ? new Date(muestra.fechaRealizacionCita)
          : muestra.fechaRecoleccion
          ? new Date(muestra.fechaRecoleccion)
          : muestra.createdAt 
          ? new Date(muestra.createdAt)
          : new Date();
        
        const fechaFormateada = fechaRealizacion.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        // Mapear tipo de muestra
        const tipoMuestraTexto = {
          'sangre': 'Sangre',
          'orina': 'Orina',
          'heces': 'Heces',
          'otros': 'Otros'
        };
        const tipoMuestra = tipoMuestraTexto[muestra.tipoMuestra] || muestra.tipoMuestra || 'Otros';

        // Mapear estado
        const estadoMuestraTexto = {
          'pendiente': 'Pendiente',
          'en análisis': 'En Análisis',
          'completado': 'Completado'
        };
        const estadoTexto = estadoMuestraTexto[muestra.estadoMuestra] || muestra.estadoMuestra || 'Pendiente';

        const estadoMuestraClase = muestra.estadoMuestra === 'pendiente' 
          ? 'pendiente' 
          : muestra.estadoMuestra === 'en análisis' 
          ? 'en-analisis' 
          : muestra.estadoMuestra === 'completado'
          ? 'completado'
          : 'pendiente';

        // Técnicos y administradores pueden cambiar el estado, editar y eliminar
        const puedeEditar = userCargo === 'tecnico' || userCargo === 'admin';
        const puedeEliminar = userCargo === 'tecnico' || userCargo === 'admin';
        const selectEstado = puedeEditar
          ? `
            <select 
              class="status-select ${estadoMuestraClase}" 
              onchange="cambiarEstadoMuestra('${muestra._id}', this.value)"
              style="padding: 0.4rem 0.75rem; border-radius: 6px; border: 2px solid; cursor: pointer; font-size: 0.9rem; font-weight: 500;">
              <option value="pendiente" ${muestra.estadoMuestra === 'pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="en análisis" ${muestra.estadoMuestra === 'en análisis' ? 'selected' : ''}>En Análisis</option>
              <option value="completado" ${muestra.estadoMuestra === 'completado' ? 'selected' : ''}>Completado</option>
            </select>
          `
          : `
            <span class="status-badge ${estadoMuestraClase}" style="padding: 0.35rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
              ${estadoTexto}
            </span>
          `;

        // Botones de acción para técnicos y administradores
        const botonesAccion = puedeEliminar
          ? `
            <div class="acciones-buttons" style="display: flex; gap: 0.5rem; align-items: center;">
              <button class="btn-action edit" onclick="editarMuestra('${muestra._id}')" title="Editar">
                <i class="fa-solid fa-pencil"></i>
              </button>
              <button class="btn-action delete" onclick="eliminarMuestraConfirm('${muestra._id}')" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
          : '<span style="font-size: 0.85rem; color: #666;"><i class="fa-solid fa-lock"></i> Solo lectura</span>';

        return `
          <tr>
            <td style="font-weight: 500; text-transform: capitalize;">${tipoMuestra}</td>
            <td>${fechaFormateada}</td>
            <td>${muestra.especialidad || 'N/A'}</td>
            <td>${selectEstado}</td>
            <td>${muestra.tecnicoLaboratorio || 'Sin asignar'}</td>
            <td>${muestra.dniPaciente || 'N/A'}</td>
            <td>
              ${botonesAccion}
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Función global para cambiar el estado de la muestra
  window.cambiarEstadoMuestra = async function(id, nuevoEstado) {
    try {
      // Actualización optimista: actualizar la UI inmediatamente
      const muestraIndex = todasLasMuestras.findIndex(m => m._id === id);
      if (muestraIndex !== -1) {
        const estadoAnterior = todasLasMuestras[muestraIndex].estadoMuestra;
        todasLasMuestras[muestraIndex].estadoMuestra = nuevoEstado;
        
        // Actualizar solo la fila específica sin recargar toda la tabla
        actualizarFilaMuestra(id, todasLasMuestras[muestraIndex]);
      }
      
      // Hacer la petición al servidor
      const data = await actualizarEstadoMuestra(id, nuevoEstado);
      
      // Actualizar con los datos del servidor si hay diferencias
      if (data && data.muestra) {
        const muestraIndex = todasLasMuestras.findIndex(m => m._id === id);
        if (muestraIndex !== -1) {
          Object.assign(todasLasMuestras[muestraIndex], data.muestra);
          actualizarFilaMuestra(id, todasLasMuestras[muestraIndex]);
        }
      }
    } catch (error) {
      alert('Error al actualizar el estado: ' + error.message);
      // Recargar muestras para restaurar el estado anterior
      await cargarMuestras(true);
    }
  };

  // Función para actualizar solo una fila específica de la tabla
  function actualizarFilaMuestra(id, muestra) {
    if (!muestrasBody) return;
    
    // Buscar la fila existente por el ID en el onchange del select
    const filas = Array.from(muestrasBody.querySelectorAll('tr'));
    let filaEncontrada = null;
    
    for (const fila of filas) {
      const select = fila.querySelector(`select[onchange*="${id}"]`);
      const span = fila.querySelector('span.status-badge');
      if (select || (span && fila.textContent.includes(id))) {
        filaEncontrada = fila;
        break;
      }
    }
    
    if (filaEncontrada) {
      // Actualizar solo el contenido de la fila sin reemplazar todo el tbody
      const fechaRealizacion = muestra.fechaRealizacionCita 
        ? new Date(muestra.fechaRealizacionCita)
        : muestra.fechaRecoleccion
        ? new Date(muestra.fechaRecoleccion)
        : muestra.createdAt 
        ? new Date(muestra.createdAt)
        : new Date();
      
      const fechaFormateada = fechaRealizacion.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // Mapear tipo de muestra
      const tipoMuestraTexto = {
        'sangre': 'Sangre',
        'orina': 'Orina',
        'heces': 'Heces',
        'otros': 'Otros'
      };
      const tipoMuestra = tipoMuestraTexto[muestra.tipoMuestra] || muestra.tipoMuestra || 'Otros';

      // Mapear estado
      const estadoMuestraTexto = {
        'pendiente': 'Pendiente',
        'en análisis': 'En Análisis',
        'completado': 'Completado'
      };
      const estadoTexto = estadoMuestraTexto[muestra.estadoMuestra] || muestra.estadoMuestra || 'Pendiente';

      const estadoMuestraClase = muestra.estadoMuestra === 'pendiente' 
        ? 'pendiente' 
        : muestra.estadoMuestra === 'en análisis' 
        ? 'en-analisis' 
        : muestra.estadoMuestra === 'completado'
        ? 'completado'
        : 'pendiente';

      // Técnicos y administradores pueden cambiar el estado, editar y eliminar
      const puedeEditar = userCargo === 'tecnico' || userCargo === 'admin';
      const puedeEliminar = userCargo === 'tecnico' || userCargo === 'admin';
      const selectEstado = puedeEditar
        ? `
          <select 
            class="status-select ${estadoMuestraClase}" 
            onchange="cambiarEstadoMuestra('${muestra._id}', this.value)"
            style="padding: 0.4rem 0.75rem; border-radius: 6px; border: 2px solid; cursor: pointer; font-size: 0.9rem; font-weight: 500;">
            <option value="pendiente" ${muestra.estadoMuestra === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="en análisis" ${muestra.estadoMuestra === 'en análisis' ? 'selected' : ''}>En Análisis</option>
            <option value="completado" ${muestra.estadoMuestra === 'completado' ? 'selected' : ''}>Completado</option>
          </select>
        `
        : `
          <span class="status-badge ${estadoMuestraClase}" style="padding: 0.35rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
            ${estadoTexto}
          </span>
        `;

      // Botones de acción para técnicos y administradores
      const botonesAccion = puedeEliminar
        ? `
          <div class="acciones-buttons" style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="btn-action edit" onclick="editarMuestra('${muestra._id}')" title="Editar">
              <i class="fa-solid fa-pencil"></i>
            </button>
            <button class="btn-action delete" onclick="eliminarMuestraConfirm('${muestra._id}')" title="Eliminar">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `
        : '<span style="font-size: 0.85rem; color: #666;"><i class="fa-solid fa-lock"></i> Solo lectura</span>';

      // Actualizar solo las celdas necesarias
      const celdas = filaEncontrada.querySelectorAll('td');
      if (celdas.length >= 7) {
        celdas[0].textContent = tipoMuestra;
        celdas[1].textContent = fechaFormateada;
        celdas[2].textContent = muestra.especialidad || 'N/A';
        celdas[3].innerHTML = selectEstado;
        celdas[4].textContent = muestra.tecnicoLaboratorio || 'Sin asignar';
        celdas[5].textContent = muestra.dniPaciente || 'N/A';
        celdas[6].innerHTML = botonesAccion;
      }
    } else {
      // Si no se encuentra la fila, recargar toda la tabla (fallback)
      renderizarMuestras();
    }
  }

  // ============================================
  // FUNCIONES DE API
  // ============================================
  async function cargarResultados() {
    try {
      const response = await fetch('/api/admin/resultados');
      
      if (!response.ok) {
        throw new Error('Error al cargar los resultados');
      }

      const data = await response.json();
      todosLosResultados = Array.isArray(data) ? data : [];
      aplicarFiltros();
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      todosLosResultados = [];
      resultadosFiltrados = [];
      renderizarResultados();
    }
  }

  async function crearResultado(datos, archivo) {
    try {
      const formData = new FormData();
      formData.append('email', datos.email);
      formData.append('tipoExamen', datos.tipoExamen);
      formData.append('fechaExamen', datos.fechaExamen);
      formData.append('observaciones', datos.observaciones || '');
      formData.append('estado', datos.estado || 'disponible');
      formData.append('pdf', archivo);

      const response = await fetch('/api/admin/resultados', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el resultado');
      }

      const resultado = await response.json();
      return resultado;
    } catch (error) {
      console.error('Error al crear resultado:', error);
      throw error;
    }
  }

  async function actualizarResultado(id, datos, archivo) {
    try {
      const formData = new FormData();
      if (datos.email) formData.append('email', datos.email);
      if (datos.tipoExamen) formData.append('tipoExamen', datos.tipoExamen);
      if (datos.fechaExamen) formData.append('fechaExamen', datos.fechaExamen);
      if (datos.observaciones !== undefined) formData.append('observaciones', datos.observaciones);
      if (datos.estado) formData.append('estado', datos.estado);
      if (archivo) formData.append('pdf', archivo);

      const response = await fetch(`/api/admin/resultados/${id}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el resultado');
      }

      const resultado = await response.json();
      return resultado;
    } catch (error) {
      console.error('Error al actualizar resultado:', error);
      throw error;
    }
  }

  async function eliminarResultado(id) {
    try {
      const response = await fetch(`/api/admin/resultados/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar el resultado');
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar resultado:', error);
      throw error;
    }
  }

  // ============================================
  // FUNCIONES DE FILTRADO
  // ============================================
  function aplicarFiltros() {
    resultadosFiltrados = [...todosLosResultados];

    // Filtro por paciente
    const pacienteFiltro = filtroPaciente.value.toLowerCase().trim();
    if (pacienteFiltro) {
      resultadosFiltrados = resultadosFiltrados.filter(resultado => 
        resultado.email.toLowerCase().includes(pacienteFiltro)
      );
    }

    // Filtro por tipo de examen
    const tipoFiltro = filtroTipoExamen.value;
    if (tipoFiltro) {
      resultadosFiltrados = resultadosFiltrados.filter(resultado => 
        resultado.tipoExamen === tipoFiltro
      );
    }

    // Filtro por estado
    const estadoFiltro = filtroEstado.value;
    if (estadoFiltro) {
      resultadosFiltrados = resultadosFiltrados.filter(resultado => 
        resultado.estado === estadoFiltro
      );
    }

    renderizarResultados();
  }

  function limpiarFiltros() {
    filtroPaciente.value = '';
    filtroTipoExamen.value = '';
    filtroEstado.value = '';
    aplicarFiltros();
  }

  // ============================================
  // FUNCIONES DE RENDERIZADO
  // ============================================
  function renderizarResultados() {
    if (resultadosFiltrados.length === 0) {
      tablaResultados.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    tablaResultados.classList.remove('hidden');
    emptyState.classList.add('hidden');

    resultadosBody.innerHTML = resultadosFiltrados
      .sort((a, b) => new Date(b.fechaResultado) - new Date(a.fechaResultado))
      .map(resultado => {
        const fecha = new Date(resultado.fechaResultado);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        return `
          <tr>
            <td>${fechaFormateada}</td>
            <td>${resultado.email}</td>
            <td>${resultado.tipoExamen}</td>
            <td>
              <span class="status-badge ${resultado.estado || 'disponible'}">
                ${resultado.estado || 'disponible'}
              </span>
            </td>
            <td>
              <div class="acciones-buttons">
                <button class="btn-action view" onclick="verPDF('${resultado._id}')" title="Ver PDF">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn-action delete" onclick="eliminarResultadoConfirm('${resultado._id}')" title="Eliminar">
                  <i class="fa-solid fa-trash"></i>
                </button>
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
  async function abrirModal(editando, resultado = null) {
    resultadoEditando = editando ? resultado : null;
    const modalTitulo = document.getElementById('modalTitulo');
    
    if (editando && resultado) {
      modalTitulo.textContent = 'Editar Resultado';
      // Buscar DNI por email
      const dni = await buscarDNIPorEmail(resultado.email || '');
      document.getElementById('inputEmail').value = dni || '';
      document.getElementById('inputTipoExamen').value = resultado.tipoExamen || '';
      // Mostrar fecha/hora del resultado ya guardado
      const inputFecha = document.getElementById('inputFechaExamen');
      if (inputFecha) {
        if (resultado.fechaExamen) {
          const fecha = new Date(resultado.fechaExamen);
          const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
          inputFecha.value = fechaLocal.toISOString().slice(0, 16);
        } else {
          inputFecha.value = '';
        }
        inputFecha.readOnly = true;
        inputFecha.style.backgroundColor = '#f3f4f6';
        inputFecha.style.cursor = 'not-allowed';
      }
      document.getElementById('inputObservaciones').value = resultado.observaciones || '';
      inputPDF.removeAttribute('required');
      fileName.textContent = resultado.nombreArchivo || 'Archivo actual';
    } else {
      modalTitulo.textContent = 'Subir Nuevo Resultado';
      formResultado.reset();
      const inputFecha = document.getElementById('inputFechaExamen');
      if (inputFecha) {
        const ahora = new Date();
        const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
        inputFecha.value = fechaLocal.toISOString().slice(0, 16);
        inputFecha.readOnly = true;
        inputFecha.style.backgroundColor = '#f3f4f6';
        inputFecha.style.cursor = 'not-allowed';
      }
      inputPDF.setAttribute('required', 'required');
      fileName.textContent = 'Seleccionar archivo PDF';
    }

    modalResultado.classList.remove('hidden');
  }

  function cerrarModal() {
    modalResultado.classList.add('hidden');
    resultadoEditando = null;
    formResultado.reset();
    fileName.textContent = 'Seleccionar archivo PDF';
  }

  function mostrarModalExito(mensaje, titulo = null) {
    const mensajeElement = document.getElementById('modalExitoMensaje');
    const tituloElement = document.getElementById('modalExitoTitulo');
    
    if (mensajeElement) {
      mensajeElement.textContent = mensaje;
    }
    
    if (tituloElement && titulo) {
      tituloElement.textContent = titulo;
    } else if (tituloElement && !titulo) {
      // Restaurar título por defecto si no se proporciona uno
      tituloElement.textContent = '¡Resultado Guardado Exitosamente!';
    }
    
    if (modalExito) {
      modalExito.classList.remove('hidden');
    }
  }

  function cerrarModalExito() {
    if (modalExito) {
      modalExito.classList.add('hidden');
    }
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
    resultadoAEliminar = null;
  }

  async function confirmarEliminacion() {
    // Si hay una muestra para eliminar
    if (muestraAEliminar) {
      try {
        await eliminarMuestra(muestraAEliminar);
        cerrarModalConfirmacion();
        const idTemp = muestraAEliminar;
        muestraAEliminar = null;
        mostrarModalExito('Muestra eliminada correctamente');
        await cargarMuestras(true);
        return;
      } catch (error) {
        cerrarModalConfirmacion();
        muestraAEliminar = null;
        mostrarModalError(error.message || 'Error al eliminar la muestra');
        return;
      }
    }

    // Si hay un resultado para eliminar
    if (!resultadoAEliminar) {
      cerrarModalConfirmacion();
      return;
    }

    try {
      await eliminarResultado(resultadoAEliminar);
      cerrarModalConfirmacion();
      resultadoAEliminar = null;
      mostrarModalExito('El resultado ha sido eliminado del sistema', 'RESULTADO ELIMINADO EXITOSAMENTE');
      await cargarResultados();
    } catch (error) {
      cerrarModalConfirmacion();
      resultadoAEliminar = null;
      mostrarModalError(error.message || 'Error al eliminar el resultado');
    }
  }

  function mostrarModalError(mensaje) {
    const mensajeElement = document.getElementById('modalErrorMensaje');
    if (mensajeElement) {
      mensajeElement.textContent = mensaje;
    }
    if (modalError) {
      modalError.classList.remove('hidden');
    }
  }

  function cerrarModalError() {
    if (modalError) {
      modalError.classList.add('hidden');
    }
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
        return null;
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

  async function guardarResultado(e) {
    e.preventDefault();

    const dni = document.getElementById('inputEmail').value.trim();
    
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
        tipoExamen: document.getElementById('inputTipoExamen').value,
        fechaExamen: document.getElementById('inputFechaExamen').value,
        observaciones: document.getElementById('inputObservaciones').value
      };

      const archivo = inputPDF.files[0];

      if (!resultadoEditando && !archivo) {
        mostrarModalError('Debe seleccionar un archivo PDF');
        return;
      }

      if (resultadoEditando) {
        await actualizarResultado(resultadoEditando._id, datos, archivo);
        mostrarModalExito('Resultado actualizado correctamente');
      } else {
        await crearResultado(datos, archivo);
        mostrarModalExito('Resultado creado correctamente');
      }

      cerrarModal();
      await cargarResultados();
    } catch (error) {
      mostrarModalError(error.message || 'Ha ocurrido un error al procesar la solicitud');
    }
  }

  // ============================================
  // FUNCIONES DE ACCIONES
  // ============================================
  window.verPDF = function(id) {
    window.open(`/api/admin/resultados/${id}/pdf`, '_blank');
  };

  window.eliminarResultadoConfirm = function(id) {
    resultadoAEliminar = id;
    mostrarModalConfirmacion('¿Está seguro de eliminar este resultado?');
  };

  // Variables para edición/eliminación de muestras
  let muestraEditando = null;
  let muestraAEliminar = null;

  // Función para editar muestra
  window.editarMuestra = async function(id) {
    try {
      const muestra = todasLasMuestras.find(m => m._id === id);
      if (!muestra) {
        mostrarModalError('No se encontró la muestra');
        return;
      }

      muestraEditando = muestra;
      
      // Buscar DNI por email si existe
      const dni = await buscarDNIPorEmail(muestra.email || '');
      if (inputEmailMuestra) inputEmailMuestra.value = dni || '';
      
      // Cargar citas
      if (dni) {
        await cargarCitasPorDNI();
        // Seleccionar la cita asociada
        if (inputCitaMuestra && muestra.citaId) {
          inputCitaMuestra.value = muestra.citaId;
        }
      }
      
      // Llenar otros campos
      const inputTipoMuestra = document.getElementById('inputTipoMuestra');
      const inputTecnicoMuestra = document.getElementById('inputTecnicoMuestra');
      const inputObservacionesMuestra = document.getElementById('inputObservacionesMuestra');
      const inputEstadoMuestra = document.getElementById('inputEstadoMuestra');
      
      if (inputTipoMuestra) inputTipoMuestra.value = muestra.tipoMuestra || '';
      if (inputTecnicoMuestra) inputTecnicoMuestra.value = muestra.tecnicoLaboratorio || '';
      if (inputObservacionesMuestra) inputObservacionesMuestra.value = muestra.observaciones || '';
      if (inputEstadoMuestra) inputEstadoMuestra.value = muestra.estadoMuestra || 'pendiente';

      // Abrir modal
      if (modalMuestra) {
        const modalTitulo = document.querySelector('#modalMuestra h3');
        if (modalTitulo) modalTitulo.textContent = 'Editar Muestra';
        
        // Actualizar botón de guardar
        const iconoBtn = document.getElementById('iconoBtnMuestra');
        const textoBtn = document.getElementById('textoBtnMuestra');
        if (iconoBtn) iconoBtn.className = 'fa-solid fa-check';
        if (textoBtn) textoBtn.textContent = 'Actualizar Muestra';
        
        modalMuestra.classList.remove('hidden');
      }
    } catch (error) {
      mostrarModalError(error.message || 'Error al cargar la muestra para editar');
    }
  };

  // Función para confirmar eliminación de muestra
  window.eliminarMuestraConfirm = function(id) {
    muestraAEliminar = id;
    mostrarModalConfirmacion('¿Está seguro de eliminar esta muestra?');
  };

  // Función para eliminar muestra
  async function eliminarMuestra(id) {
    try {
      const response = await fetch(`/api/muestras/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar la muestra');
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar muestra:', error);
      throw error;
    }
  }

  // Hacer confirmarEliminacion global para que pueda ser llamada desde HTML
  window.confirmarEliminacion = confirmarEliminacion;

});


// FRONTEND/public/admin-resultados.js
document.addEventListener('DOMContentLoaded', () => {
  // Variables globales
  let todosLosResultados = [];
  let resultadosFiltrados = [];
  let resultadoEditando = null;

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

  // Inicialización
  init();

  // ============================================
  // FUNCIONES DE INICIALIZACIÓN
  // ============================================
  function init() {
    cargarResultados();
    setupEventListeners();
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
  function abrirModal(editando, resultado = null) {
    resultadoEditando = editando ? resultado : null;
    const modalTitulo = document.getElementById('modalTitulo');
    
    if (editando && resultado) {
      modalTitulo.textContent = 'Editar Resultado';
      document.getElementById('inputEmail').value = resultado.email || '';
      document.getElementById('inputTipoExamen').value = resultado.tipoExamen || '';
      document.getElementById('inputFechaExamen').value = resultado.fechaExamen ? new Date(resultado.fechaExamen).toISOString().split('T')[0] : '';
      document.getElementById('inputObservaciones').value = resultado.observaciones || '';
      document.getElementById('inputEstado').value = resultado.estado || 'disponible';
      inputPDF.removeAttribute('required');
      fileName.textContent = resultado.nombreArchivo || 'Archivo actual';
    } else {
      modalTitulo.textContent = 'Subir Nuevo Resultado';
      formResultado.reset();
      document.getElementById('inputEstado').value = 'disponible';
      document.getElementById('inputFechaExamen').valueAsDate = new Date();
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

  async function guardarResultado(e) {
    e.preventDefault();

    const datos = {
      email: document.getElementById('inputEmail').value,
      tipoExamen: document.getElementById('inputTipoExamen').value,
      fechaExamen: document.getElementById('inputFechaExamen').value,
      observaciones: document.getElementById('inputObservaciones').value,
      estado: document.getElementById('inputEstado').value
    };

    const archivo = inputPDF.files[0];

    if (!resultadoEditando && !archivo) {
      alert('Debe seleccionar un archivo PDF');
      return;
    }

    try {
      if (resultadoEditando) {
        await actualizarResultado(resultadoEditando._id, datos, archivo);
        alert('Resultado actualizado correctamente');
      } else {
        await crearResultado(datos, archivo);
        alert('Resultado creado correctamente');
      }

      cerrarModal();
      await cargarResultados();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  // ============================================
  // FUNCIONES DE ACCIONES
  // ============================================
  window.verPDF = function(id) {
    window.open(`/api/admin/resultados/${id}/pdf`, '_blank');
  };

  window.eliminarResultadoConfirm = async function(id) {
    if (!confirm('¿Está seguro de eliminar este resultado?')) {
      return;
    }

    try {
      await eliminarResultado(id);
      alert('Resultado eliminado correctamente');
      await cargarResultados();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
});


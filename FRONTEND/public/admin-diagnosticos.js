document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const tableBody = document.getElementById("diagnosticos-tbody");
  const btnAdd = document.getElementById("btnAgregarDiagnostico");
  const modal = document.getElementById("modal-diagnostico");
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("form-diagnostico");
  const btnCancel = document.getElementById("btn-cancel");
  const inputId = document.getElementById("diagnostico-id");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const diagnosticosTable = document.getElementById("diagnosticosTable");
  const toastContainer = document.getElementById("toastContainer");

  // Inputs del formulario
  const inputEmail = document.getElementById("email-paciente");
  const inputMedico = document.getElementById("id-medico");
  const inputFecha = document.getElementById("fecha-diagnostico");
  const inputSintomas = document.getElementById("sintomas");
  const inputDiagnostico = document.getElementById("diagnostico");
  const inputObservaciones = document.getElementById("observaciones");
  const checkboxReceta = document.getElementById("tiene-receta");
  const recetaContainer = document.getElementById("receta-container");
  const medicamentosList = document.getElementById("medicamentos-list");
  const btnAddMedicamento = document.getElementById("btnAgregarMedicamento");

  // Filtros
  const filtroPaciente = document.getElementById("filtroPaciente");
  const filtroMedico = document.getElementById("filtroMedico");
  const filtroFecha = document.getElementById("filtroFecha");

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

  let isEditing = false;
  let allDiagnosticos = [];
  let allMedicos = [];
  let medicamentoCounter = 0;
  let medicoActual = null; // Almacenar información del médico actual

  // === Funciones de Toast Notification ===
  function showToast(type, title, message) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icons = {
      success: "fa-circle-check",
      error: "fa-circle-exclamation",
      info: "fa-circle-info"
    };
    
    toast.innerHTML = `
      <i class="fa-solid ${icons[type]} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar">
        <i class="fa-solid fa-times"></i>
      </button>
    `;
    
    toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      toast.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    });
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // === Cargar información del médico actual ===
  async function cargarMedicoActual() {
    const userCargo = sessionStorage.getItem("userCargo");
    const userEmail = sessionStorage.getItem("userEmail");
    
    if (userCargo === "medico" && userEmail) {
      try {
        const res = await fetch(`/api/perfil-medico?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          medicoActual = await res.json();

          // Actualizar avatar del topbar para el médico
          const topbarAvatar = document.getElementById("topbar-avatar-medico");
          const defaultAvatar = "../assets2/img/avatar-sofia.jpg";
          const avatarUrl = medicoActual.imagen
            ? `http://localhost:5000${medicoActual.imagen}`
            : defaultAvatar;

          if (topbarAvatar) {
            topbarAvatar.src = avatarUrl;
            topbarAvatar.onerror = () => {
              topbarAvatar.src = defaultAvatar;
            };
          }
        }
      } catch (error) {
        console.warn("Error al cargar información del médico actual:", error);
      }
    }
  }

  // === Cargar médicos ===
  async function cargarMedicos() {
    try {
      const res = await fetch("/api/personal");
      if (!res.ok) throw new Error("No se pudo obtener médicos");
      const personal = await res.json();
      
      // Filtrar solo médicos activos
      allMedicos = personal.filter(p => p.cargo === "medico" && p.estado === "activo");
      
      // Limpiar select
      inputMedico.innerHTML = '<option value="">Seleccione un médico</option>';
      
      // Si el usuario es médico, mostrar solo su información
      const userCargo = sessionStorage.getItem("userCargo");
      if (userCargo === "medico" && medicoActual) {
        const option = document.createElement("option");
        option.value = medicoActual._id;
        option.textContent = `${medicoActual.nombres} ${medicoActual.apellidos}${medicoActual.especialidad && medicoActual.especialidad !== 'N/A' ? ' - ' + medicoActual.especialidad : ''}`;
        option.selected = true;
        inputMedico.appendChild(option);
        // Deshabilitar el select
        inputMedico.disabled = true;
        inputMedico.style.backgroundColor = "#f3f4f6";
        inputMedico.style.cursor = "not-allowed";
      } else {
        // Llenar select con todos los médicos (para admin)
        allMedicos.forEach(medico => {
          const option = document.createElement("option");
          option.value = medico._id;
          option.textContent = `${medico.nombres} ${medico.apellidos}${medico.especialidad && medico.especialidad !== 'N/A' ? ' - ' + medico.especialidad : ''}`;
          inputMedico.appendChild(option);
        });
        inputMedico.disabled = false;
        inputMedico.style.backgroundColor = "";
        inputMedico.style.cursor = "";
      }
    } catch (error) {
      console.error("Error al cargar médicos:", error);
      showToast("error", "Error", "No se pudieron cargar los médicos");
    }
  }

  // === Agregar medicamento ===
  function agregarMedicamento(medicamento = null) {
    const medicamentoId = medicamentoCounter++;
    const medicamentoDiv = document.createElement("div");
    medicamentoDiv.className = "medicamento-item";
    medicamentoDiv.dataset.id = medicamentoId;
    
    medicamentoDiv.innerHTML = `
      <div class="medicamento-header">
        <h5>Medicamento ${medicamentoId + 1}</h5>
        <button type="button" class="btn-remove-medicamento" onclick="this.closest('.medicamento-item').remove()">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Nombre del Medicamento *</label>
          <input type="text" class="medicamento-nombre" required 
                 value="${medicamento ? medicamento.nombre : ''}" 
                 placeholder="Ej: Paracetamol 500mg">
        </div>
        <div class="form-group">
          <label>Dosis *</label>
          <input type="text" class="medicamento-dosis" required 
                 value="${medicamento ? medicamento.dosis : ''}" 
                 placeholder="Ej: 1 tableta">
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Frecuencia *</label>
          <input type="text" class="medicamento-frecuencia" required 
                 value="${medicamento ? medicamento.frecuencia : ''}" 
                 placeholder="Ej: Cada 8 horas">
        </div>
        <div class="form-group">
          <label>Duración *</label>
          <input type="text" class="medicamento-duracion" required 
                 value="${medicamento ? medicamento.duracion : ''}" 
                 placeholder="Ej: 7 días">
        </div>
      </div>
      <div class="form-group">
        <label>Instrucciones</label>
        <textarea class="medicamento-instrucciones" rows="2" 
                  placeholder="Instrucciones especiales...">${medicamento ? medicamento.instrucciones || '' : ''}</textarea>
      </div>
    `;
    
    medicamentosList.appendChild(medicamentoDiv);
  }

  // === Obtener medicamentos del formulario ===
  function obtenerMedicamentos() {
    const medicamentos = [];
    const items = medicamentosList.querySelectorAll(".medicamento-item");
    
    items.forEach(item => {
      const nombre = item.querySelector(".medicamento-nombre").value.trim();
      const dosis = item.querySelector(".medicamento-dosis").value.trim();
      const frecuencia = item.querySelector(".medicamento-frecuencia").value.trim();
      const duracion = item.querySelector(".medicamento-duracion").value.trim();
      const instrucciones = item.querySelector(".medicamento-instrucciones").value.trim();
      
      if (nombre && dosis && frecuencia && duracion) {
        medicamentos.push({
          nombre,
          dosis,
          frecuencia,
          duracion,
          instrucciones,
        });
      }
    });
    
    return medicamentos;
  }

  // === Filtrar diagnósticos ===
  function filtrarDiagnosticos() {
    const pacienteFilter = filtroPaciente.value.toLowerCase().trim();
    const medicoFilter = filtroMedico.value.toLowerCase().trim();
    const fechaFilter = filtroFecha.value;

    let filtered = allDiagnosticos.filter(d => {
      const emailMatch = !pacienteFilter || d.email.toLowerCase().includes(pacienteFilter);
      const medicoMatch = !medicoFilter || 
        (d.idMedico && (
          d.idMedico.nombres.toLowerCase().includes(medicoFilter) ||
          d.idMedico.apellidos.toLowerCase().includes(medicoFilter)
        ));
      const fechaMatch = !fechaFilter || 
        new Date(d.fechaDiagnostico).toISOString().split('T')[0] === fechaFilter;
      
      return emailMatch && medicoMatch && fechaMatch;
    });

    renderDiagnosticos(filtered);
  }

  // === Renderizar diagnósticos ===
  function renderDiagnosticos(diagnosticos) {
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    if (diagnosticos.length === 0) {
      if (diagnosticosTable) diagnosticosTable.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    
    if (diagnosticosTable) diagnosticosTable.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    
    diagnosticos.forEach((d) => {
      const row = document.createElement("tr");
      
      const fecha = new Date(d.fechaDiagnostico);
      const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const medicoNombre = d.idMedico 
        ? `${d.idMedico.nombres} ${d.idMedico.apellidos}`
        : "N/A";
      
      const tieneReceta = d.receta && d.receta.tieneReceta && d.receta.medicamentos.length > 0;
      const recetaBadge = tieneReceta 
        ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Sí</span>'
        : '<span class="badge badge-secondary">No</span>';
      
      const estadoBadge = d.estado === 'completado'
        ? '<span class="status-badge completado">Completado</span>'
        : d.estado === 'pendiente'
        ? '<span class="status-badge pendiente">Pendiente</span>'
        : '<span class="status-badge archivado">Archivado</span>';
      
      row.innerHTML = `
        <td>${fechaFormateada}</td>
        <td>${d.email}</td>
        <td>${medicoNombre}</td>
        <td class="diagnostico-text">${d.diagnostico.substring(0, 50)}${d.diagnostico.length > 50 ? '...' : ''}</td>
        <td>${recetaBadge}</td>
        <td>${estadoBadge}</td>
        <td>
          <button class="btn-historial" type="button" aria-label="Ver historial médico" title="Ver historial médico del paciente">
            <i class="fa-solid fa-clipboard-list"></i>
          </button>
          <button class="btn-edit" type="button" aria-label="Editar diagnóstico">
            <i class="fa-solid fa-pencil"></i>
          </button>
          <button class="btn-delete" type="button" aria-label="Eliminar diagnóstico">
            <i class="fa-solid fa-trash"></i>
          </button>
          <button class="btn-view" type="button" aria-label="Ver diagnóstico">
            <i class="fa-solid fa-eye"></i>
          </button>
        </td>
      `;

      const [btnHistorial, btnEdit, btnDelete, btnView] = row.querySelectorAll("button");
      
      // Verificar si el usuario es médico y si puede editar/eliminar este diagnóstico
      const userCargo = sessionStorage.getItem("userCargo");
      const puedeEditar = userCargo === "admin" || 
                        (userCargo === "medico" && medicoActual && 
                         d.idMedico?._id?.toString() === medicoActual._id?.toString());
      
      btnHistorial.addEventListener("click", () => verHistorialMedico({ email: d.email }));
      
      if (puedeEditar) {
        btnEdit.addEventListener("click", () => openModal(true, d));
        btnDelete.addEventListener("click", async () => {
          if (!d._id) return;
          if (!confirm("¿Está seguro que desea eliminar este diagnóstico?")) return;
          try {
            const del = await fetch(`/api/diagnosticos/${d._id}`, { method: "DELETE" });
            if (!del.ok) {
              const errorData = await del.json();
              throw new Error(errorData.error || "No se pudo eliminar el diagnóstico");
            }
            showToast("success", "Diagnóstico eliminado", "El diagnóstico ha sido eliminado correctamente");
            cargarDiagnosticos();
          } catch (e) {
            console.error(e);
            showToast("error", "Error", e.message || "No se pudo eliminar el diagnóstico");
          }
        });
      } else {
        // Ocultar botones de editar y eliminar si el médico no puede editar este diagnóstico
        btnEdit.style.display = "none";
        btnDelete.style.display = "none";
      }
      
      btnView.addEventListener("click", () => verDiagnostico(d));

      tableBody.appendChild(row);
    });
  }

  // === Ver historial médico del paciente ===
  async function verHistorialMedico(paciente) {
    if (!paciente.email) {
      showToast("error", "Error", "No se encontró el email del paciente");
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
            <div class="spinner"></div>
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
      showToast("error", "Error", "No se encontró el email del paciente");
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
            <div class="spinner"></div>
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
      showToast("error", "Error", "No se encontró el email del paciente");
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
            <div class="spinner"></div>
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
      showToast("error", "Error", "No se encontró el email del paciente");
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

        showToast("success", "Éxito", "Información médica guardada correctamente");
        editModal.remove();
        window.verInformacionMedica(email);
      } catch (error) {
        console.error("Error al guardar información médica:", error);
        showToast("error", "Error", error.message || "No se pudo guardar la información médica");
      }
    };
  };

  // === Ver diagnóstico completo ===
  function verDiagnostico(diagnostico) {
    const medicoNombre = diagnostico.idMedico 
      ? `${diagnostico.idMedico.nombres} ${diagnostico.idMedico.apellidos}`
      : "N/A";
    
    const fecha = new Date(diagnostico.fechaDiagnostico);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let recetaHTML = "";
    if (diagnostico.receta && diagnostico.receta.tieneReceta && diagnostico.receta.medicamentos.length > 0) {
      recetaHTML = "<h4>Receta Médica:</h4><ul>";
      diagnostico.receta.medicamentos.forEach((med, index) => {
        recetaHTML += `
          <li>
            <strong>${index + 1}. ${med.nombre}</strong><br>
            Dosis: ${med.dosis} | Frecuencia: ${med.frecuencia} | Duración: ${med.duracion}
            ${med.instrucciones ? `<br>Instrucciones: ${med.instrucciones}` : ''}
          </li>
        `;
      });
      recetaHTML += "</ul>";
    } else {
      recetaHTML = "<p>No se emitió receta médica.</p>";
    }
    
    const contenido = `
      <h3>Informe de Diagnóstico</h3>
      <p><strong>Paciente:</strong> ${diagnostico.email}</p>
      <p><strong>Médico:</strong> ${medicoNombre}</p>
      <p><strong>Fecha:</strong> ${fechaFormateada}</p>
      <hr>
      <p><strong>Síntomas:</strong></p>
      <p>${diagnostico.sintomas || 'No especificados'}</p>
      <hr>
      <p><strong>Diagnóstico:</strong></p>
      <p>${diagnostico.diagnostico}</p>
      <hr>
      <p><strong>Observaciones:</strong></p>
      <p>${diagnostico.observaciones || 'Ninguna'}</p>
      <hr>
      ${recetaHTML}
    `;
    
    // Crear modal de vista
    const viewModal = document.createElement("div");
    viewModal.className = "modal";
    viewModal.innerHTML = `
      <div class="modal-content modal-view">
        <div class="modal-header">
          <h3>Ver Diagnóstico</h3>
          <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          ${contenido}
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(viewModal);
  }

  // === Cargar diagnósticos ===
  async function cargarDiagnosticos() {
    if (!tableBody) return;
    
    if (loadingState) loadingState.classList.remove("hidden");
    if (diagnosticosTable) diagnosticosTable.classList.add("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    
    try {
      // Obtener información del usuario desde sessionStorage
      const userEmail = sessionStorage.getItem("userEmail");
      const userCargo = sessionStorage.getItem("userCargo");
      
      // Construir URL con parámetros de consulta
      let url = "/api/diagnosticos";
      const params = new URLSearchParams();
      if (userEmail) params.append("userEmail", userEmail);
      if (userCargo) params.append("userCargo", userCargo);
      if (params.toString()) url += "?" + params.toString();
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo obtener diagnósticos");
      const data = await res.json();

      allDiagnosticos = data;
      
      if (loadingState) loadingState.classList.add("hidden");
      
      filtrarDiagnosticos();
    } catch (err) {
      console.error(err);
      if (loadingState) loadingState.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      showToast("error", "Error", "No se pudieron cargar los diagnósticos");
    }
  }

  // === Abrir modal ===
  async function openModal(editMode, diagnostico = null) {
    isEditing = !!editMode;
    modalTitle.textContent = editMode ? "Editar Diagnóstico" : "Nuevo Diagnóstico";

    // Cargar información del médico actual si es necesario
    const userCargo = sessionStorage.getItem("userCargo");
    if (userCargo === "medico" && !medicoActual) {
      await cargarMedicoActual();
    }

    // Cargar médicos si no están cargados
    if (allMedicos.length === 0) {
      await cargarMedicos();
    }

    if (editMode && diagnostico) {
      inputId.value = diagnostico._id || "";
      // Buscar DNI por email
      const dni = await buscarDNIPorEmail(diagnostico.email || "");
      inputEmail.value = dni || "";
      
      // Si el usuario es médico, verificar que solo pueda editar sus propios diagnósticos
      if (userCargo === "medico" && medicoActual) {
        const diagnosticoMedicoId = diagnostico.idMedico?._id?.toString();
        const medicoActualId = medicoActual._id?.toString();
        
        // Si el diagnóstico no pertenece al médico actual, no permitir editar
        if (diagnosticoMedicoId !== medicoActualId) {
          showToast("error", "Error", "Solo puede editar diagnósticos que usted ha creado");
          return;
        }
        
        // Pre-seleccionar y deshabilitar el campo de médico
        inputMedico.value = medicoActual._id || "";
        inputMedico.disabled = true;
        inputMedico.style.backgroundColor = "#f3f4f6";
        inputMedico.style.cursor = "not-allowed";
      } else {
        // Para admin, permitir seleccionar cualquier médico
        inputMedico.value = diagnostico.idMedico?._id || "";
        inputMedico.disabled = false;
        inputMedico.style.backgroundColor = "";
        inputMedico.style.cursor = "";
      }
      
      if (diagnostico.fechaDiagnostico) {
        const fecha = new Date(diagnostico.fechaDiagnostico);
        inputFecha.value = fecha.toISOString().slice(0, 16);
      }
      // En modo edición, mantener la fecha original (ya está establecida arriba)
      // El campo ya es readonly desde el HTML
      
      inputSintomas.value = diagnostico.sintomas || "";
      inputDiagnostico.value = diagnostico.diagnostico || "";
      inputObservaciones.value = diagnostico.observaciones || "";
      
      // Cargar receta
      if (diagnostico.receta && diagnostico.receta.tieneReceta && diagnostico.receta.medicamentos.length > 0) {
        checkboxReceta.checked = true;
        recetaContainer.classList.remove("hidden");
        medicamentosList.innerHTML = "";
        diagnostico.receta.medicamentos.forEach(med => {
          agregarMedicamento(med);
        });
      } else {
        checkboxReceta.checked = false;
        recetaContainer.classList.add("hidden");
        medicamentosList.innerHTML = "";
      }
    } else {
      // Modo creación
      inputId.value = "";
      inputEmail.value = "";
      
      // Si el usuario es médico, pre-seleccionar su ID
      if (userCargo === "medico" && medicoActual) {
        inputMedico.value = medicoActual._id || "";
        inputMedico.disabled = true;
        inputMedico.style.backgroundColor = "#f3f4f6";
        inputMedico.style.cursor = "not-allowed";
      } else {
        inputMedico.value = "";
        inputMedico.disabled = false;
        inputMedico.style.backgroundColor = "";
        inputMedico.style.cursor = "";
      }
      
      // Establecer fecha y hora actual automáticamente
      const ahora = new Date();
      // Ajustar al timezone local para que se muestre correctamente
      const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
      inputFecha.value = fechaLocal.toISOString().slice(0, 16);
      inputSintomas.value = "";
      inputDiagnostico.value = "";
      inputObservaciones.value = "";
      checkboxReceta.checked = false;
      recetaContainer.classList.add("hidden");
      medicamentosList.innerHTML = "";
    }

    modal.classList.remove("hidden");
  }

  // === Cerrar modal ===
  function closeModal() {
    modal.classList.add("hidden");
    form.reset();
    medicamentosList.innerHTML = "";
    medicamentoCounter = 0;
    
    // Restaurar estado del select de médico según el cargo del usuario
    const userCargo = sessionStorage.getItem("userCargo");
    if (userCargo === "medico" && medicoActual) {
      inputMedico.disabled = true;
      inputMedico.style.backgroundColor = "#f3f4f6";
      inputMedico.style.cursor = "not-allowed";
    } else {
      inputMedico.disabled = false;
      inputMedico.style.backgroundColor = "";
      inputMedico.style.cursor = "";
    }
  }

  // === Event Listeners ===
  if (btnAdd) btnAdd.addEventListener("click", () => openModal(false));
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  
  const btnCloseModal = document.getElementById("btn-close-modal");
  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", closeModal);
  }
  
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Checkbox de receta
  if (checkboxReceta) {
    checkboxReceta.addEventListener("change", (e) => {
      if (e.target.checked) {
        recetaContainer.classList.remove("hidden");
        if (medicamentosList.children.length === 0) {
          agregarMedicamento();
        }
      } else {
        recetaContainer.classList.add("hidden");
      }
    });
  }

  // Agregar medicamento
  if (btnAddMedicamento) {
    btnAddMedicamento.addEventListener("click", () => {
      agregarMedicamento();
    });
  }

  // Filtros
  if (filtroPaciente) {
    filtroPaciente.addEventListener("input", filtrarDiagnosticos);
  }
  if (filtroMedico) {
    filtroMedico.addEventListener("input", filtrarDiagnosticos);
  }
  if (filtroFecha) {
    filtroFecha.addEventListener("change", filtrarDiagnosticos);
  }

  // Form submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      try {
        const dni = inputEmail.value.trim();
        
        // Validar DNI
        if (!dni || !/^\d{8}$/.test(dni)) {
          showToast("error", "Error", "Por favor, ingrese un DNI válido (8 dígitos)");
          return;
        }

        const tieneReceta = checkboxReceta.checked;
        const medicamentos = tieneReceta ? obtenerMedicamentos() : [];
        
        if (tieneReceta && medicamentos.length === 0) {
          showToast("error", "Error", "Debe agregar al menos un medicamento si desea emitir una receta");
          return;
        }

        // Buscar el email del paciente por DNI
        const email = await buscarEmailPorDNI(dni);

        const payload = {
          email: email,
          idMedico: inputMedico.value,
          fechaDiagnostico: inputFecha.value,
          diagnostico: inputDiagnostico.value.trim(),
          sintomas: inputSintomas.value.trim(),
          observaciones: inputObservaciones.value.trim(),
          receta: {
            medicamentos,
            tieneReceta,
          },
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          let res;
          if (isEditing && inputId.value) {
            res = await fetch(`/api/diagnosticos/${inputId.value}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          } else {
            res = await fetch("/api/diagnosticos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          }
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Error al guardar el diagnóstico");
          }

          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          
          closeModal();
          cargarDiagnosticos();
          showToast("success", "Éxito", isEditing ? "Diagnóstico actualizado correctamente" : "Diagnóstico creado correctamente");
        } catch (error) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          throw error;
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Error", err.message || "No se pudo guardar el diagnóstico");
      }
    });
  }

  // Inicializar
  cargarMedicoActual().then(() => {
    cargarMedicos();
    cargarDiagnosticos();
  });

  // Configurar el avatar del topbar para redirigir al perfil del médico
  const topbarAvatar = document.getElementById("topbar-avatar-medico");
  if (topbarAvatar) {
    topbarAvatar.addEventListener("click", () => {
      window.location.href = "/admin/perfil";
    });
  }
});


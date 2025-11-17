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

  let isEditing = false;
  let allDiagnosticos = [];
  let allMedicos = [];
  let medicamentoCounter = 0;

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
      
      // Llenar select
      allMedicos.forEach(medico => {
        const option = document.createElement("option");
        option.value = medico._id;
        option.textContent = `${medico.nombres} ${medico.apellidos}${medico.especialidad && medico.especialidad !== 'N/A' ? ' - ' + medico.especialidad : ''}`;
        inputMedico.appendChild(option);
      });
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

      const [btnEdit, btnDelete, btnView] = row.querySelectorAll("button");
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
      btnView.addEventListener("click", () => verDiagnostico(d));

      tableBody.appendChild(row);
    });
  }

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
      const res = await fetch("/api/diagnosticos");
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

    // Cargar médicos si no están cargados
    if (allMedicos.length === 0) {
      await cargarMedicos();
    }

    if (editMode && diagnostico) {
      inputId.value = diagnostico._id || "";
      inputEmail.value = diagnostico.email || "";
      inputMedico.value = diagnostico.idMedico?._id || "";
      
      if (diagnostico.fechaDiagnostico) {
        const fecha = new Date(diagnostico.fechaDiagnostico);
        inputFecha.value = fecha.toISOString().slice(0, 16);
      }
      
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
      inputId.value = "";
      inputEmail.value = "";
      inputMedico.value = "";
      inputFecha.value = new Date().toISOString().slice(0, 16);
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
        const tieneReceta = checkboxReceta.checked;
        const medicamentos = tieneReceta ? obtenerMedicamentos() : [];
        
        if (tieneReceta && medicamentos.length === 0) {
          showToast("error", "Error", "Debe agregar al menos un medicamento si desea emitir una receta");
          return;
        }

        const payload = {
          email: inputEmail.value.trim().toLowerCase(),
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
  cargarMedicos();
  cargarDiagnosticos();
});


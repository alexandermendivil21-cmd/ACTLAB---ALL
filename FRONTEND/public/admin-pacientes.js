document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM (coinciden con pacientes.html)
  const tableBody = document.getElementById("user-tbody");
  const btnAdd = document.getElementById("btn-add");
  const modal = document.getElementById("modal-form");
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("form-user");
  const btnCancel = document.getElementById("btn-cancel");
  const inputId = document.getElementById("user-id");
  const searchInput = document.getElementById("searchInput");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const pacientesTable = document.getElementById("pacientesTable");
  const toastContainer = document.getElementById("toastContainer");

  const inputTipoDoc = document.getElementById("tipo-documento");
  const inputNumDoc = document.getElementById("num-documento");
  const inputFechaEmision = document.getElementById("fecha-emision");
  const inputFirst = document.getElementById("first-name");
  const inputLast = document.getElementById("last-name");
  const inputAge = document.getElementById("age");
  const inputGender = document.getElementById("gender");
  const inputAddress = document.getElementById("address");
  const inputPhone = document.getElementById("phone");
  const inputEmail = document.getElementById("email");
  const inputPassword = document.getElementById("password");
  const passwordGroup = document.getElementById("password-group");

  let isEditing = false;
  let allPacientes = []; // Almacenar todos los pacientes para búsqueda

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
    
    // Cerrar toast al hacer clic en el botón de cerrar
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      toast.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // === Función de búsqueda ===
  function filtrarPacientes(searchTerm) {
    if (!searchTerm.trim()) {
      renderPacientes(allPacientes);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = allPacientes.filter(p => {
      const nombres = (p.nombres || "").toLowerCase();
      const apellidos = (p.apellidos || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const celular = (p.celular || "").toLowerCase();
      
      return nombres.includes(term) || 
             apellidos.includes(term) || 
             email.includes(term) || 
             celular.includes(term);
    });

    renderPacientes(filtered);
  }

  // Event listener para búsqueda
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filtrarPacientes(e.target.value);
    });
  }

  // Validaciones en tiempo real
  function validarNumeroDocumento() {
    const tipo = inputTipoDoc.value;
    const numDoc = inputNumDoc.value.trim();
    const numDocGroup = inputNumDoc.closest('.form-group');
    
    // Remover mensajes de error previos
    const errorMsg = numDocGroup.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
    
    if (!tipo || !numDoc) {
      inputNumDoc.style.borderColor = '';
      return true;
    }
    
    // Validar formato según tipo
    let esValido = true;
    let mensaje = '';
    
    if (!/^\d+$/.test(numDoc)) {
      esValido = false;
      mensaje = 'El número de documento solo debe contener dígitos.';
    } else if ((tipo === 'dni' || tipo === 'pasaporte') && numDoc.length !== 8) {
      esValido = false;
      mensaje = 'El DNI/Pasaporte debe tener 8 dígitos.';
    } else if (tipo === 'carnet-ext' && numDoc.length !== 9) {
      esValido = false;
      mensaje = 'El Carné de extranjería debe tener 9 dígitos.';
    }
    
    if (!esValido) {
      inputNumDoc.style.borderColor = '#dc2626';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = '#dc2626';
      errorDiv.style.fontSize = '0.875rem';
      errorDiv.style.marginTop = '0.25rem';
      errorDiv.textContent = mensaje;
      numDocGroup.appendChild(errorDiv);
    } else {
      inputNumDoc.style.borderColor = '#10b981';
    }
    
    return esValido;
  }

  function validarFechaEmision() {
    const fecha = inputFechaEmision.value;
    const fechaGroup = inputFechaEmision.closest('.form-group');
    
    const errorMsg = fechaGroup.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
    
    if (!fecha) {
      inputFechaEmision.style.borderColor = '';
      return true;
    }
    
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (isNaN(fechaObj.getTime()) || fechaObj >= hoy) {
      inputFechaEmision.style.borderColor = '#dc2626';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = '#dc2626';
      errorDiv.style.fontSize = '0.875rem';
      errorDiv.style.marginTop = '0.25rem';
      errorDiv.textContent = 'La fecha de emisión debe ser anterior a hoy.';
      fechaGroup.appendChild(errorDiv);
      return false;
    } else {
      inputFechaEmision.style.borderColor = '#10b981';
      return true;
    }
  }

  function validarEmail() {
    const email = inputEmail.value.trim();
    const emailGroup = inputEmail.closest('.form-group');
    
    const errorMsg = emailGroup.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
    
    if (!email) {
      inputEmail.style.borderColor = '';
      return true;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      inputEmail.style.borderColor = '#dc2626';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = '#dc2626';
      errorDiv.style.fontSize = '0.875rem';
      errorDiv.style.marginTop = '0.25rem';
      errorDiv.textContent = 'Ingrese un email válido.';
      emailGroup.appendChild(errorDiv);
      return false;
    } else {
      inputEmail.style.borderColor = '#10b981';
      return true;
    }
  }

  function validarCelular() {
    const celular = inputPhone.value.trim();
    const phoneGroup = inputPhone.closest('.form-group');
    
    const errorMsg = phoneGroup.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
    
    if (!celular) {
      inputPhone.style.borderColor = '';
      return true;
    }
    
    if (!/^\d{9}$/.test(celular)) {
      inputPhone.style.borderColor = '#dc2626';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = '#dc2626';
      errorDiv.style.fontSize = '0.875rem';
      errorDiv.style.marginTop = '0.25rem';
      errorDiv.textContent = 'El celular debe tener 9 dígitos.';
      phoneGroup.appendChild(errorDiv);
      return false;
    } else {
      inputPhone.style.borderColor = '#10b981';
      return true;
    }
  }

  function validarPassword() {
    const password = inputPassword.value;
    const passwordGroup = inputPassword.closest('.form-group');
    
    const errorMsg = passwordGroup.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
    
    if (!password) {
      inputPassword.style.borderColor = '';
      return true;
    }
    
    if (password.length < 6) {
      inputPassword.style.borderColor = '#dc2626';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = '#dc2626';
      errorDiv.style.fontSize = '0.875rem';
      errorDiv.style.marginTop = '0.25rem';
      errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      passwordGroup.appendChild(errorDiv);
      return false;
    } else {
      inputPassword.style.borderColor = '#10b981';
      return true;
    }
  }

  // Event listeners para validaciones en tiempo real
  if (inputTipoDoc) {
    inputTipoDoc.addEventListener('change', () => {
      inputNumDoc.value = '';
      inputNumDoc.style.borderColor = '';
      const errorMsg = inputNumDoc.closest('.form-group').querySelector('.error-message');
      if (errorMsg) errorMsg.remove();
      if (inputNumDoc.value) validarNumeroDocumento();
    });
  }

  if (inputNumDoc) {
    inputNumDoc.addEventListener('input', (e) => {
      // Solo permitir números
      e.target.value = e.target.value.replace(/\D/g, '');
      validarNumeroDocumento();
    });
  }

  if (inputFechaEmision) {
    // Establecer fecha máxima (hoy)
    const hoy = new Date();
    hoy.setDate(hoy.getDate() - 1); // Un día antes de hoy
    inputFechaEmision.setAttribute('max', hoy.toISOString().split('T')[0]);
    inputFechaEmision.addEventListener('change', validarFechaEmision);
  }

  if (inputPhone) {
    inputPhone.addEventListener('input', (e) => {
      // Solo permitir números y limitar a 9 dígitos
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
      validarCelular();
    });
  }

  if (inputEmail) {
    inputEmail.addEventListener('blur', validarEmail);
  }

  if (inputPassword) {
    inputPassword.addEventListener('input', validarPassword);
  }

  async function openModal(editMode, paciente = null) {
    isEditing = !!editMode;
    modalTitle.textContent = editMode ? "Editar Paciente" : "Nuevo Paciente";

    // Mostrar/ocultar campo de contraseña
    if (passwordGroup) {
      passwordGroup.style.display = editMode ? "none" : "block";
    }
    if (inputPassword) {
      inputPassword.required = !editMode;
    }

    if (editMode && paciente) {
      // Cargar datos del paciente para edición
      inputId.value = paciente._id || "";
      if (inputTipoDoc) inputTipoDoc.value = paciente.tipo_documento || "";
      if (inputNumDoc) inputNumDoc.value = paciente.num_documento || "";
      if (inputFechaEmision && paciente.fecha_emision) {
        const fecha = new Date(paciente.fecha_emision);
        inputFechaEmision.value = fecha.toISOString().split('T')[0];
      }
      inputFirst.value = paciente.nombres || "";
      inputLast.value = paciente.apellidos || "";
      inputAge.value = paciente.edad ?? "";
      inputGender.value = paciente.genero || "";
      inputAddress.value = paciente.direccion || "";
      inputPhone.value = paciente.celular || "";
      if (inputEmail) inputEmail.value = paciente.email || "";
      
      // Deshabilitar campos únicos en edición
      if (inputTipoDoc) inputTipoDoc.disabled = true;
      if (inputNumDoc) inputNumDoc.disabled = true;
      if (inputEmail) inputEmail.disabled = true;
    } else {
      // Limpiar formulario para nuevo paciente
      inputId.value = "";
      if (inputTipoDoc) inputTipoDoc.value = "";
      if (inputNumDoc) {
        inputNumDoc.value = "";
        inputNumDoc.style.borderColor = '';
      }
      if (inputFechaEmision) {
        inputFechaEmision.value = "";
        inputFechaEmision.style.borderColor = '';
      }
      inputFirst.value = "";
      inputLast.value = "";
      inputAge.value = "";
      inputGender.value = "";
      inputAddress.value = "";
      if (inputPhone) {
        inputPhone.value = "";
        inputPhone.style.borderColor = '';
      }
      if (inputEmail) {
        inputEmail.value = "";
        inputEmail.style.borderColor = '';
      }
      if (inputPassword) {
        inputPassword.value = "";
        inputPassword.style.borderColor = '';
      }
      
      // Habilitar todos los campos
      if (inputTipoDoc) inputTipoDoc.disabled = false;
      if (inputNumDoc) inputNumDoc.disabled = false;
      if (inputEmail) inputEmail.disabled = false;
      
      // Limpiar mensajes de error
      document.querySelectorAll('.error-message').forEach(msg => msg.remove());
    }

    modal.classList.remove("hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");
    // Limpiar estilos de validación
    document.querySelectorAll('.form-group input, .form-group select').forEach(input => {
      input.style.borderColor = '';
    });
    // Limpiar mensajes de error
    document.querySelectorAll('.error-message').forEach(msg => msg.remove());
    // Resetear formulario
    form.reset();
  }

  // === Función para renderizar pacientes ===
  function renderPacientes(pacientes) {
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    // Ocultar tabla si no hay pacientes
    if (pacientes.length === 0) {
      if (pacientesTable) pacientesTable.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    
    // Mostrar tabla y ocultar estado vacío
    if (pacientesTable) pacientesTable.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    
    pacientes.forEach((p) => {
      const row = document.createElement("tr");
      
      // Formatear género para mostrar
      const generoFormateado = p.genero 
        ? p.genero.charAt(0).toUpperCase() + p.genero.slice(1).replace(/-/g, ' ')
        : "";
      
      row.innerHTML = `
        <td>${p.nombres ?? ""}</td>
        <td>${p.apellidos ?? ""}</td>
        <td>${p.edad ?? ""}</td>
        <td>${generoFormateado}</td>
        <td>${p.email ?? ""}</td>
        <td>${p.celular ?? ""}</td>
        <td>
          <button class="btn-edit" type="button" aria-label="Editar paciente">
            <i class="fa-solid fa-pencil"></i>
          </button>
          <button class="btn-delete" type="button" aria-label="Eliminar paciente">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

      const [btnEdit, btnDelete] = row.querySelectorAll("button");
      btnEdit.addEventListener("click", () => openModal(true, p));
      btnDelete.addEventListener("click", async () => {
        if (!p._id) return;
        if (!confirm("¿Está seguro que desea eliminar este paciente?")) return;
        try {
          const del = await fetch(`/api/pacientes/${p._id}`, { method: "DELETE" });
          if (!del.ok) {
            const errorData = await del.json();
            throw new Error(errorData.message || "No se pudo eliminar el paciente");
          }
          showToast("success", "Paciente eliminado", "El paciente ha sido eliminado correctamente");
          cargarPacientes();
        } catch (e) {
          console.error(e);
          showToast("error", "Error", e.message || "No se pudo eliminar el paciente");
        }
      });

      tableBody.appendChild(row);
    });
  }

  // === Función para cargar pacientes ===
  async function cargarPacientes() {
    if (!tableBody) return;
    
    // Mostrar estado de carga
    if (loadingState) loadingState.classList.remove("hidden");
    if (pacientesTable) pacientesTable.classList.add("hidden");
    if (emptyState) emptyState.classList.add("hidden");
    
    try {
      const res = await fetch("/api/pacientes");
      if (!res.ok) throw new Error("No se pudo obtener pacientes");
      const data = await res.json();

      allPacientes = data;
      
      // Ocultar estado de carga
      if (loadingState) loadingState.classList.add("hidden");
      
      // Renderizar pacientes (aplicará filtro si hay búsqueda activa)
      const searchTerm = searchInput ? searchInput.value : "";
      filtrarPacientes(searchTerm);
    } catch (err) {
      console.error(err);
      if (loadingState) loadingState.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      showToast("error", "Error", "No se pudieron cargar los pacientes");
    }
  }

  // Eventos UI
  if (btnAdd) btnAdd.addEventListener("click", () => openModal(false));

  // Botón de actualizar
  const btnRefresh = document.getElementById("btn-refresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      btnRefresh.disabled = true;
      const originalHTML = btnRefresh.innerHTML;
      btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
      
      try {
        await cargarPacientes();
        showToast("success", "Actualizado", "Lista de pacientes actualizada correctamente");
      } catch (error) {
        showToast("error", "Error", "No se pudo actualizar la lista de pacientes");
      } finally {
        btnRefresh.disabled = false;
        btnRefresh.innerHTML = originalHTML;
      }
    });
  }
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  
  // Botón cerrar modal (X)
  const btnCloseModal = document.getElementById("btn-close-modal");
  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", closeModal);
  }
  
  // Cerrar modal al hacer clic fuera
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
  // Cerrar modal con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      try {
        if (isEditing && inputId.value) {
          // Actualizar paciente existente
          const payload = {
            nombres: inputFirst.value,
            apellidos: inputLast.value,
            edad: parseInt(inputAge.value, 10),
            genero: inputGender.value,
            direccion: inputAddress.value,
            celular: inputPhone.value,
          };

          const res = await fetch(`/api/pacientes/${inputId.value}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Error al actualizar paciente");
          }
        } else {
          // Crear nuevo paciente
          // Validar todos los campos antes de enviar
          if (!validarNumeroDocumento() || !validarFechaEmision() || !validarEmail() || !validarCelular() || !validarPassword()) {
            showToast("error", "Error de validación", "Por favor, corrija los errores en el formulario antes de continuar");
            return;
          }

          const payload = {
            tipo_documento: inputTipoDoc.value.trim(),
            num_documento: inputNumDoc.value.trim(),
            fecha_emision: inputFechaEmision.value,
            nombres: inputFirst.value.trim(),
            apellidos: inputLast.value.trim(),
            edad: parseInt(inputAge.value, 10),
            genero: inputGender.value,
            direccion: inputAddress.value.trim(),
            celular: inputPhone.value.trim(),
            email: inputEmail.value.trim().toLowerCase(),
            password: inputPassword.value,
          };

          // Validar campos requeridos
          if (!payload.tipo_documento || !payload.num_documento || !payload.fecha_emision ||
              !payload.nombres || !payload.apellidos || !payload.edad || !payload.genero ||
              !payload.direccion || !payload.celular || !payload.email || !payload.password) {
            showToast("error", "Campos incompletos", "Por favor, complete todos los campos obligatorios");
            return;
          }

          // Validar edad
          if (isNaN(payload.edad) || payload.edad < 0 || payload.edad > 120) {
            showToast("error", "Edad inválida", "La edad debe ser un número entre 0 y 120");
            inputAge.focus();
            return;
          }

          // Mostrar indicador de carga
          const submitBtn = form.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;
          submitBtn.disabled = true;
          submitBtn.textContent = 'Guardando...';

          try {
            const res = await fetch("/api/pacientes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || "Error al crear paciente");
            }

            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          } catch (error) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            throw error;
          }
        }

        closeModal();
        form.reset();
        cargarPacientes();
        showToast("success", "Éxito", isEditing ? "Paciente actualizado correctamente" : "Paciente creado correctamente");
      } catch (err) {
        console.error(err);
        showToast("error", "Error", err.message || "No se pudo guardar el paciente");
      }
    });
  }

  // Inicializar
  cargarPacientes();
});
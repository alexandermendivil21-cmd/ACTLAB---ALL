// public/perfil-medico.js
document.addEventListener("DOMContentLoaded", () => {
  const email = sessionStorage.getItem("userEmail");
  if (!email) {
    window.location.href = "/login";
    return;
  }

  // Verificar que el usuario es médico
  const userCargo = sessionStorage.getItem("userCargo");
  if (userCargo !== "medico") {
    window.location.href = "/admin/citas";
    return;
  }

  // Elementos del DOM
  const profileView = document.getElementById("profile-view");
  const profileEditForm = document.getElementById("profile-edit-form");
  const btnEditProfile = document.getElementById("btn-edit-profile");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");
  const btnChangeAvatar = document.getElementById("btn-change-avatar");
  const inputImagen = document.getElementById("input-imagen");
  const editImagen = document.getElementById("edit-imagen");
  const previewImagen = document.getElementById("preview-imagen");
  
  const horariosView = document.getElementById("horarios-view");
  const horariosEdit = document.getElementById("horarios-edit");
  const btnEditHorarios = document.getElementById("btn-edit-horarios");
  const btnSaveHorarios = document.getElementById("btn-save-horarios");
  const btnCancelHorarios = document.getElementById("btn-cancel-horarios");
  const btnAddHorario = document.getElementById("btn-add-horario");
  const horariosContainer = document.getElementById("horarios-container");
  const horariosList = document.getElementById("horarios-list");
  const toastContainer = document.getElementById("toastContainer");

  let horariosData = [];
  let horarioCounter = 0;

  // === Funciones de Toast ===
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

  // === Cargar perfil ===
  async function cargarPerfil() {
    try {
      const res = await fetch(`/api/perfil-medico?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener el perfil");
      }
      const medico = await res.json();

      // Actualizar vista de solo lectura
      document.getElementById("profile-name").textContent = `${medico.nombres || ""} ${medico.apellidos || ""}`.trim() || "Médico";
      document.getElementById("profile-edad").textContent = medico.edad ? `${medico.edad} años` : "No especificado";
      
      const generoFormateado = medico.genero 
        ? medico.genero.charAt(0).toUpperCase() + medico.genero.slice(1).replace(/-/g, ' ')
        : "No especificado";
      document.getElementById("profile-genero").textContent = generoFormateado;
      
      const tipoDocFormateado = medico.tipo_documento 
        ? medico.tipo_documento.toUpperCase().replace(/-/g, ' ')
        : "No especificado";
      document.getElementById("profile-tipo-doc").textContent = tipoDocFormateado;
      
      document.getElementById("profile-num-doc").textContent = medico.num_documento || "No especificado";
      document.getElementById("profile-email").textContent = medico.email || "No especificado";
      document.getElementById("profile-celular").textContent = medico.celular || "No especificado";
      document.getElementById("profile-direccion").textContent = medico.direccion || "No especificado";
      document.getElementById("profile-especialidad").textContent = medico.especialidad || "No especificado";
      
      const estadoFormateado = medico.estado 
        ? medico.estado.charAt(0).toUpperCase() + medico.estado.slice(1)
        : "No especificado";
      document.getElementById("profile-estado").textContent = estadoFormateado;

      // Actualizar imagen de perfil
      const profileAvatar = document.getElementById("profile-avatar");
      const defaultAvatar = "../assets2/img/avatar-sofia.jpg";
      const avatarUrl = medico.imagen 
        ? `http://localhost:5000${medico.imagen}` 
        : defaultAvatar;
      profileAvatar.src = avatarUrl;
      profileAvatar.onerror = () => {
        profileAvatar.src = defaultAvatar;
      };

      // Cargar horarios
      horariosData = medico.horariosDisponibilidad || [];
      renderizarHorarios();

      // Actualizar nombre en el header
      const userName = document.getElementById("userName");
      if (userName) {
        userName.textContent = `${medico.nombres} ${medico.apellidos}`;
      }

    } catch (error) {
      console.error("Error al cargar perfil:", error);
      showToast("error", "Error", error.message || "No se pudo cargar el perfil");
    }
  }

  // === Renderizar horarios (vista de solo lectura) ===
  function renderizarHorarios() {
    if (horariosData.length === 0) {
      horariosList.innerHTML = `
        <p style="color: #777; font-size: 0.9rem; text-align: center; padding: 1rem;">
          No hay horarios configurados. Haz clic en "Gestionar Horarios" para agregar tu disponibilidad.
        </p>
      `;
      return;
    }

    const diasSemana = {
      lunes: "Lunes",
      martes: "Martes",
      miercoles: "Miércoles",
      jueves: "Jueves",
      viernes: "Viernes",
      sabado: "Sábado",
      domingo: "Domingo"
    };

    horariosList.innerHTML = "";
    
    horariosData.forEach(horario => {
      const horarioDiv = document.createElement("div");
      horarioDiv.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: #f8f9fa; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 0.75rem; transition: all 0.2s;";
      
      horarioDiv.addEventListener("mouseenter", () => {
        horarioDiv.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
      });
      horarioDiv.addEventListener("mouseleave", () => {
        horarioDiv.style.boxShadow = "none";
      });
      
      const contenido = document.createElement("div");
      contenido.style.cssText = "display: flex; align-items: center; gap: 1.5rem; flex: 1;";
      
      const diaDiv = document.createElement("div");
      diaDiv.style.cssText = "min-width: 120px; font-weight: 600; color: #1e88e5; font-size: 0.95rem;";
      diaDiv.textContent = diasSemana[horario.diaSemana] || horario.diaSemana;
      
      const horaDiv = document.createElement("div");
      horaDiv.style.cssText = "color: #212121; font-size: 0.95rem; font-weight: 500;";
      horaDiv.textContent = `${horario.horaInicio} - ${horario.horaFin}`;
      
      contenido.appendChild(diaDiv);
      contenido.appendChild(horaDiv);
      
      const badge = document.createElement("span");
      if (horario.disponible !== false) {
        badge.style.cssText = "padding: 0.35rem 0.85rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; background: #d4edda; color: #155724;";
        badge.textContent = "Disponible";
      } else {
        badge.style.cssText = "padding: 0.35rem 0.85rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; background: #f8d7da; color: #721c24;";
        badge.textContent = "No disponible";
      }
      
      horarioDiv.appendChild(contenido);
      horarioDiv.appendChild(badge);
      horariosList.appendChild(horarioDiv);
    });
  }

  // === Renderizar horarios (vista de edición) ===
  function renderizarHorariosEdit() {
    horariosContainer.innerHTML = "";
    
    horariosData.forEach((horario, index) => {
      const horarioDiv = document.createElement("div");
      horarioDiv.style.cssText = "display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; border: 1px solid #e5e7eb; flex-wrap: wrap;";
      
      const select = document.createElement("select");
      select.className = "horario-dia-select";
      select.dataset.index = index;
      select.style.cssText = "flex: 1; min-width: 150px; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 0.95rem; background: white; transition: all 0.2s; cursor: pointer;";
      const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
      const diasNombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      dias.forEach((dia, idx) => {
        const option = document.createElement("option");
        option.value = dia;
        option.textContent = diasNombres[idx];
        if (horario.diaSemana === dia) option.selected = true;
        select.appendChild(option);
      });
      
      const inputInicio = document.createElement("input");
      inputInicio.type = "time";
      inputInicio.className = "horario-inicio";
      inputInicio.dataset.index = index;
      inputInicio.value = horario.horaInicio || "09:00";
      inputInicio.required = true;
      inputInicio.style.cssText = "flex: 1; min-width: 120px; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 0.95rem; transition: all 0.2s;";
      
      const inputFin = document.createElement("input");
      inputFin.type = "time";
      inputFin.className = "horario-fin";
      inputFin.dataset.index = index;
      inputFin.value = horario.horaFin || "17:00";
      inputFin.required = true;
      inputFin.style.cssText = "flex: 1; min-width: 120px; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 0.95rem; transition: all 0.2s;";
      
      const btnEliminar = document.createElement("button");
      btnEliminar.type = "button";
      btnEliminar.className = "btn-remove-horario";
      btnEliminar.dataset.index = index;
      btnEliminar.style.cssText = "padding: 0.75rem 1rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;";
      btnEliminar.innerHTML = '<i class="fa-solid fa-trash"></i> Eliminar';
      
      horarioDiv.appendChild(select);
      horarioDiv.appendChild(inputInicio);
      horarioDiv.appendChild(inputFin);
      horarioDiv.appendChild(btnEliminar);
      horariosContainer.appendChild(horarioDiv);
    });

    // Agregar event listeners para los botones de eliminar
    horariosContainer.querySelectorAll(".btn-remove-horario").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.index);
        horariosData.splice(index, 1);
        renderizarHorariosEdit();
      });
      
      // Manejar hover sin atributos inline
      btn.addEventListener("mouseenter", () => {
        btn.style.background = "#c82333";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "#dc3545";
      });
    });

    // Agregar event listeners para actualizar datos cuando cambian los valores
    horariosContainer.querySelectorAll(".horario-dia-select, .horario-inicio, .horario-fin").forEach(input => {
      input.addEventListener("change", () => {
        const index = parseInt(input.dataset.index);
        if (horariosData[index]) {
          if (input.classList.contains("horario-dia-select")) {
            horariosData[index].diaSemana = input.value;
          } else if (input.classList.contains("horario-inicio")) {
            horariosData[index].horaInicio = input.value;
          } else if (input.classList.contains("horario-fin")) {
            horariosData[index].horaFin = input.value;
          }
        }
      });
      
      // Manejar focus sin atributos inline
      input.addEventListener("focus", () => {
        input.style.borderColor = "#1e88e5";
      });
      input.addEventListener("blur", () => {
        input.style.borderColor = "#e5e7eb";
      });
    });
  }

  // === Agregar nuevo horario ===
  function agregarHorario() {
    horariosData.push({
      diaSemana: "lunes",
      horaInicio: "09:00",
      horaFin: "17:00",
      disponible: true
    });
    renderizarHorariosEdit();
  }

  // === Editar perfil ===
  btnEditProfile.addEventListener("click", () => {
    profileView.style.display = "none";
    profileEditForm.style.display = "block";
    
    // Cargar datos actuales en el formulario
    const res = fetch(`/api/perfil-medico?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(medico => {
        document.getElementById("edit-nombres").value = medico.nombres || "";
        document.getElementById("edit-apellidos").value = medico.apellidos || "";
        document.getElementById("edit-edad").value = medico.edad || "";
        document.getElementById("edit-genero").value = medico.genero || "masculino";
        document.getElementById("edit-direccion").value = medico.direccion || "";
        document.getElementById("edit-celular").value = medico.celular || "";
        document.getElementById("edit-especialidad").value = medico.especialidad || "N/A";
        
        // Cargar imagen actual
        if (medico.imagen) {
          previewImagen.src = `http://localhost:5000${medico.imagen}`;
          previewImagen.style.display = "block";
        }
      })
      .catch(error => {
        console.error("Error al cargar datos:", error);
        showToast("error", "Error", "No se pudieron cargar los datos para editar");
      });
  });

  // === Cancelar edición de perfil ===
  btnCancelEdit.addEventListener("click", () => {
    profileView.style.display = "block";
    profileEditForm.style.display = "none";
    profileEditForm.reset();
    previewImagen.style.display = "none";
  });

  // === Preview de imagen ===
  editImagen.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImagen.src = e.target.result;
        previewImagen.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  // === Event delegation para inputs del formulario ===
  profileEditForm.addEventListener("focusin", (e) => {
    if (e.target.classList.contains("form-input")) {
      e.target.style.borderColor = "#1e88e5";
      e.target.style.boxShadow = "0 0 0 3px rgba(30, 136, 229, 0.1)";
    }
  }, true);
  
  profileEditForm.addEventListener("focusout", (e) => {
    if (e.target.classList.contains("form-input")) {
      e.target.style.borderColor = "#e5e7eb";
      e.target.style.boxShadow = "none";
    }
  }, true);

  // === Cambiar avatar ===
  btnChangeAvatar.addEventListener("click", () => {
    inputImagen.click();
  });

  inputImagen.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("imagen", file);

    try {
      const res = await fetch(`/api/perfil-medico?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar la imagen");
      }

      showToast("success", "Éxito", "Imagen de perfil actualizada correctamente");
      await cargarPerfil();
    } catch (error) {
      console.error("Error al actualizar imagen:", error);
      showToast("error", "Error", error.message || "No se pudo actualizar la imagen");
    }
  });

  // === Guardar perfil ===
  profileEditForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nombres", document.getElementById("edit-nombres").value);
    formData.append("apellidos", document.getElementById("edit-apellidos").value);
    formData.append("edad", document.getElementById("edit-edad").value);
    formData.append("genero", document.getElementById("edit-genero").value);
    formData.append("direccion", document.getElementById("edit-direccion").value);
    formData.append("celular", document.getElementById("edit-celular").value);
    formData.append("especialidad", document.getElementById("edit-especialidad").value);

    // Agregar imagen si hay una nueva
    if (editImagen.files[0]) {
      formData.append("imagen", editImagen.files[0]);
    }

    try {
      const res = await fetch(`/api/perfil-medico?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar el perfil");
      }

      showToast("success", "Éxito", "Perfil actualizado correctamente");
      profileView.style.display = "block";
      profileEditForm.style.display = "none";
      await cargarPerfil();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      showToast("error", "Error", error.message || "No se pudo actualizar el perfil");
    }
  });

  // === Editar horarios ===
  btnEditHorarios.addEventListener("click", () => {
    horariosView.style.display = "none";
    horariosEdit.style.display = "block";
    renderizarHorariosEdit();
  });

  // === Cancelar edición de horarios ===
  btnCancelHorarios.addEventListener("click", () => {
    horariosView.style.display = "block";
    horariosEdit.style.display = "none";
    // Recargar datos originales
    cargarPerfil();
  });

  // === Agregar horario ===
  btnAddHorario.addEventListener("click", () => {
    agregarHorario();
  });

  // === Guardar horarios ===
  btnSaveHorarios.addEventListener("click", async () => {
    // Validar horarios
    for (let i = 0; i < horariosData.length; i++) {
      const horario = horariosData[i];
      if (!horario.diaSemana || !horario.horaInicio || !horario.horaFin) {
        showToast("error", "Error", "Por favor completa todos los campos de los horarios");
        return;
      }

      // Validar que horaFin sea mayor que horaInicio
      const [hInicio, mInicio] = horario.horaInicio.split(':').map(Number);
      const [hFin, mFin] = horario.horaFin.split(':').map(Number);
      const tiempoInicio = hInicio * 60 + mInicio;
      const tiempoFin = hFin * 60 + mFin;
      if (tiempoFin <= tiempoInicio) {
        showToast("error", "Error", `El horario ${i + 1} tiene una hora de fin inválida`);
        return;
      }
    }

    try {
      const res = await fetch(`/api/perfil-medico?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          horariosDisponibilidad: horariosData
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar los horarios");
      }

      showToast("success", "Éxito", "Horarios guardados correctamente");
      horariosView.style.display = "block";
      horariosEdit.style.display = "none";
      await cargarPerfil();
    } catch (error) {
      console.error("Error al guardar horarios:", error);
      showToast("error", "Error", error.message || "No se pudieron guardar los horarios");
    }
  });

  // Cargar perfil al iniciar
  cargarPerfil();
});


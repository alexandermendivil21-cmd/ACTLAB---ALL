// public/perfil-tecnico.js
document.addEventListener("DOMContentLoaded", () => {
  const email = sessionStorage.getItem("userEmail");
  if (!email) {
    window.location.href = "/login";
    return;
  }

  // Verificar que el usuario es técnico
  const userCargo = sessionStorage.getItem("userCargo");
  if (userCargo !== "tecnico") {
    window.location.href = "/admin/resultados";
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
  const toastContainer = document.getElementById("toastContainer");

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
      const res = await fetch(`/api/perfil-tecnico?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener el perfil");
      }
      const tecnico = await res.json();

      // Actualizar vista de solo lectura
      document.getElementById("profile-name").textContent = `${tecnico.nombres || ""} ${tecnico.apellidos || ""}`.trim() || "Técnico";
      document.getElementById("profile-edad").textContent = tecnico.edad ? `${tecnico.edad} años` : "No especificado";
      
      const generoFormateado = tecnico.genero 
        ? tecnico.genero.charAt(0).toUpperCase() + tecnico.genero.slice(1).replace(/-/g, ' ')
        : "No especificado";
      document.getElementById("profile-genero").textContent = generoFormateado;
      
      const tipoDocFormateado = tecnico.tipo_documento 
        ? tecnico.tipo_documento.toUpperCase().replace(/-/g, ' ')
        : "No especificado";
      document.getElementById("profile-tipo-doc").textContent = tipoDocFormateado;
      
      document.getElementById("profile-num-doc").textContent = tecnico.num_documento || "No especificado";
      document.getElementById("profile-email").textContent = tecnico.email || "No especificado";
      document.getElementById("profile-celular").textContent = tecnico.celular || "No especificado";
      document.getElementById("profile-direccion").textContent = tecnico.direccion || "No especificado";
      
      const estadoFormateado = tecnico.estado 
        ? tecnico.estado.charAt(0).toUpperCase() + tecnico.estado.slice(1)
        : "No especificado";
      document.getElementById("profile-estado").textContent = estadoFormateado;

      // Actualizar imagen de perfil
      const profileAvatar = document.getElementById("profile-avatar");
      const defaultAvatar = "../assets2/img/avatar-sofia.jpg";
      const avatarUrl = tecnico.imagen 
        ? `http://localhost:5000${tecnico.imagen}` 
        : defaultAvatar;
      profileAvatar.src = avatarUrl;
      profileAvatar.onerror = () => {
        profileAvatar.src = defaultAvatar;
      };

      // Actualizar nombre en el header
      const userName = document.getElementById("userName");
      if (userName) {
        userName.textContent = `${tecnico.nombres} ${tecnico.apellidos}`;
      }

    } catch (error) {
      console.error("Error al cargar perfil:", error);
      showToast("error", "Error", error.message || "No se pudo cargar el perfil");
    }
  }

  // === Editar perfil ===
  btnEditProfile.addEventListener("click", () => {
    profileView.style.display = "none";
    profileEditForm.style.display = "block";
    
    // Cargar datos actuales en el formulario
    fetch(`/api/perfil-tecnico?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(tecnico => {
        document.getElementById("edit-nombres").value = tecnico.nombres || "";
        document.getElementById("edit-apellidos").value = tecnico.apellidos || "";
        document.getElementById("edit-edad").value = tecnico.edad || "";
        document.getElementById("edit-genero").value = tecnico.genero || "masculino";
        document.getElementById("edit-direccion").value = tecnico.direccion || "";
        document.getElementById("edit-celular").value = tecnico.celular || "";
        
        // Cargar imagen actual
        if (tecnico.imagen) {
          previewImagen.src = `http://localhost:5000${tecnico.imagen}`;
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
      const res = await fetch(`/api/perfil-tecnico?email=${encodeURIComponent(email)}`, {
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

    // Agregar imagen si hay una nueva
    if (editImagen.files[0]) {
      formData.append("imagen", editImagen.files[0]);
    }

    try {
      const res = await fetch(`/api/perfil-tecnico?email=${encodeURIComponent(email)}`, {
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

  // Cargar perfil al iniciar
  cargarPerfil();
});


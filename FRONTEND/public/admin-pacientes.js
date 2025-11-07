document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM (coinciden con pacientes.html)
  const tableBody = document.getElementById("user-tbody");
  const btnAdd = document.getElementById("btn-add");
  const modal = document.getElementById("modal-form");
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("form-user");
  const btnCancel = document.getElementById("btn-cancel");
  const inputId = document.getElementById("user-id");

  const inputFirst = document.getElementById("first-name");
  const inputLast = document.getElementById("last-name");
  const inputAge = document.getElementById("age");
  const inputGender = document.getElementById("gender");
  const inputAddress = document.getElementById("address");
  const inputPhone = document.getElementById("phone");

  let isEditing = false;

  function openModal(editMode, paciente = null) {
    isEditing = !!editMode;
    modalTitle.textContent = editMode ? "Editar Paciente" : "Nuevo Paciente";

    if (editMode && paciente) {
      inputId.value = paciente._id || "";
      inputFirst.value = paciente.nombres || "";
      inputLast.value = paciente.apellidos || "";
      inputAge.value = paciente.edad ?? "";
      inputGender.value = paciente.genero || "";
      inputAddress.value = paciente.direccion || "";
      inputPhone.value = paciente.celular || "";
    } else {
      // Si no hay paciente, significa que están intentando crear uno nuevo
      // Deshabilitamos el botón de crear desde aquí
      alert("Para crear un nuevo paciente, use el formulario de registro.");
      return;
    }

    modal.classList.remove("hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  async function cargarPacientes() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    try {
      const res = await fetch("/api/pacientes");
      if (!res.ok) throw new Error("No se pudo obtener pacientes");
      const data = await res.json();

      data.forEach((p) => {
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
          <td>${p.direccion ?? ""}</td>
          <td>${p.celular ?? ""}</td>
          <td>
            <button class="btn-edit" type="button">✏️</button>
            <button class="btn-delete" type="button">🗑️</button>
          </td>
        `;

        const [btnEdit, btnDelete] = row.querySelectorAll("button");
        btnEdit.addEventListener("click", () => openModal(true, p));
        btnDelete.addEventListener("click", async () => {
          if (!p._id) return;
          if (!confirm("¿Seguro que deseas eliminar este paciente?")) return;
          try {
            const del = await fetch(`/api/pacientes/${p._id}`, { method: "DELETE" });
            if (!del.ok) throw new Error("No se pudo eliminar");
            cargarPacientes();
          } catch (e) {
            console.error(e);
            alert("No se pudo eliminar el paciente");
          }
        });

        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Eventos UI
  if (btnAdd) btnAdd.addEventListener("click", () => openModal(false));
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        nombres: inputFirst.value,
        apellidos: inputLast.value,
        edad: parseInt(inputAge.value, 10),
        genero: inputGender.value,
        direccion: inputAddress.value,
        celular: inputPhone.value,
      };

      try {
        if (isEditing && inputId.value) {
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
          // Deshabilitar creación desde aquí - deben usar el registro
          alert("Para crear un nuevo paciente, use el formulario de registro. Desde aquí solo puede editar pacientes existentes.");
          return;
        }

        closeModal();
        form.reset();
        cargarPacientes();
      } catch (err) {
        console.error(err);
        alert(err.message || "No se pudo guardar el paciente");
      }
    });
  }

  // Inicializar
  cargarPacientes();
});
// js/dashboardPaciente.js
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const content = document.getElementById("content");
  const navLinks = Array.from(document.querySelectorAll(".nav-item"));

  if (!sidebar || !sidebarToggle || !content) {
    console.error("Elementos esenciales no encontrados en DOM");
    return;
  }

  // ============================================================
  // 🔹 UTILIDADES GENERALES
  // ============================================================
  const isMobile = () => window.innerWidth <= 768;

  const loadSection = (section) => {
    fetch(`views/${section}.html`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => {
        content.style.transition = "opacity 0.25s ease";
        content.style.opacity = 0;
        setTimeout(() => {
          content.innerHTML = html;
          content.style.opacity = 1;

          // Inicializar vistas específicas
          if (section === "citas") initCitasView();
          else if (section === "solicitar-cita") initSolicitarCitaView();
          else if (section === "resultados") initResultadosView();
          else if (section === "ver-resultado") initVerResultadoView();
          else if (section === "profile") initProfileView();
          else if (section === "overview") initOverviewView();
        }, 180);
      })
      .catch((err) => {
        console.error("Error cargando vista", section, err);
        content.innerHTML = `<p style="color:crimson">Error al cargar la vista "${section}".</p>`;
      });
  };

  // ============================================================
  // 🔹 SIDEBAR
  // ============================================================
  const toggleSidebar = () => {
    if (isMobile()) sidebar.classList.toggle("open");
    else sidebar.classList.toggle("collapsed");
  };

  sidebarToggle.addEventListener("click", toggleSidebar);
  sidebarToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSidebar();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      const section = link.dataset.section || link.getAttribute("href").substring(1);
      
      // Manejar logout
      if (section === "logout") {
        // Limpiar datos de sesión
        sessionStorage.clear();
        localStorage.removeItem("token");
        // Redirigir al login
        window.location.href = "/login";
        return;
      }
      
      loadSection(section);

      if (isMobile()) sidebar.classList.remove("open");
    });
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) sidebar.classList.remove("open");
  });

  // ============================================================
  // 🔹 GESTIÓN DE CITAS CON BACKEND
  // ============================================================
  const getCitas = async () => {
    const email = sessionStorage.getItem("userEmail");
    if (!email) return [];
    try {
      const res = await fetch(`http://localhost:5000/api/citas?email=${email}`);
      if (!res.ok) throw new Error("Error al obtener citas");
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("❌ Error obteniendo citas:", error);
      return [];
    }
  };

  const renderCitas = (citas) => {
  const citasList = document.getElementById("citas-list");
  if (!citasList) return;

  if (!citas || citas.length === 0) {
    citasList.innerHTML = `<div class="empty-state">
      <i class="fa-regular fa-calendar"></i>
      <p>No tienes citas registradas</p>
    </div>`;
    return;
  }

  citasList.innerHTML = citas
    .map((cita) => {
      const motivo = cita.motivoCita || "Sin motivo especificado";
      const fecha = cita.fechaCita
        ? new Date(cita.fechaCita).toLocaleDateString("es-PE")
        : "Sin fecha";
      const estado = cita.estado || "Pendiente";
      const especialidad = cita.especialidad || "No especificada";
      const horario = cita.horario || "-";

      return `
      <div class="cita-card">
        <div class="cita-info">
          <div class="cita-date">${fecha} | ${horario}</div>
          <div class="cita-detail"><strong>Especialidad:</strong> ${especialidad}</div>
          <div class="cita-detail"><strong>Motivo:</strong> ${motivo}</div>
          <div class="cita-detail"><strong>Estado:</strong> <span class="chip ${estado === "Pendiente" ? "secondary" : estado === "Cancelada" ? "danger" : "success"}">${estado}</span></div>
        </div>
        <div class="cita-actions">
          <button class="chip" onclick="editarCitaPrompt('${cita._id}')"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="chip danger" onclick="cancelarCita('${cita._id}')"><i class="fa-solid fa-ban"></i> Cancelar</button>
          <button class="chip" onclick="pagarCita('${cita._id}')"><i class="fa-solid fa-credit-card"></i> Pagar</button>
        </div>
      </div>
      `;
    })
    .join("");
};

  const initCitasView = async () => {
    const btnAgendarCita = document.getElementById("btnAgendarCita");
    if (btnAgendarCita)
      btnAgendarCita.addEventListener("click", () => loadSection("solicitar-cita"));

    const citasList = document.getElementById("citas-list");
    if (citasList) {
      const citas = await getCitas();
      renderCitas(citas);
    }
  };

  // =====================
  // Acciones de Cita
  // =====================
  window.cancelarCita = async (id) => {
    if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;
    try {
      const res = await fetch(`/api/citas/${id}/cancelar`, { method: 'PATCH' });
      if (!res.ok) throw new Error('No se pudo cancelar la cita');
      alert('Cita cancelada. El administrador fue notificado.');
      const citas = await getCitas();
      renderCitas(citas);
    } catch (e) {
      alert(e.message);
    }
  };

  window.editarCitaPrompt = async (id) => {
    const nuevaFecha = prompt('Nueva fecha (YYYY-MM-DD):');
    if (!nuevaFecha) return;
    const nuevoHorario = prompt('Nuevo horario (HH:mm):');
    if (!nuevoHorario) return;
    try {
      const res = await fetch(`/api/citas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaCita: nuevaFecha, horario: nuevoHorario })
      });
      if (!res.ok) throw new Error('No se pudo editar la cita');
      alert('Cita actualizada. El administrador fue notificado.');
      const citas = await getCitas();
      renderCitas(citas);
    } catch (e) {
      alert(e.message);
    }
  };

  window.pagarCita = async (id) => {
    const monto = 50; // monto fijo de ejemplo
    const email = sessionStorage.getItem('userEmail');
    if (!email) return alert('No se encontró el email del usuario');
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, citaId: id, monto, metodo: 'tarjeta' })
      });
      if (!res.ok) throw new Error('No se pudo registrar el pago');
      alert('Pago realizado con éxito. El administrador fue notificado.');
    } catch (e) {
      alert(e.message);
    }
  };

  // ============================================================
  // ✅ GUARDAR CITA CON MODAL
  // ============================================================
  const handleSolicitarCita = async () => {
    const email = sessionStorage.getItem("userEmail");
    const especialidad = document.getElementById("especialidad")?.value;
    const fechaCita = document.getElementById("fechaCita")?.value;
    const horario = document.getElementById("horario")?.value;
    const motivoCita = document.getElementById("motivoCita")?.value;

    console.log("Datos enviados al backend:", {
      email,
      especialidad,
      fechaCita,
      horario,
      motivoCita,
    });

    if (!email || !especialidad || !fechaCita || !horario || !motivoCita) {
      showModal(false, "Campos incompletos", "Por favor complete todos los campos antes de continuar.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, especialidad, fechaCita, horario, motivoCita }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar la cita");

      console.log("Cita registrada correctamente:", data);

      showModal(true, "Cita registrada", "Tu cita ha sido registrada correctamente.");
    } catch (error) {
      console.error("Error al guardar la cita:", error);
      showModal(false, "Error al guardar cita", error.message || "No se pudo registrar la cita.");
    }
  };

  // ============================================================
  // 🔹 MODAL RESULTADO
  // ============================================================
  const showModal = (success, title, message) => {
    const modal = document.getElementById("modalResultado");
    if (!modal) return;
    const modalIcon = document.getElementById("modalIcon");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const btnModalSiguiente = document.getElementById("btnModalSiguiente");

    modalIcon.className = success ? "modal-icon success" : "modal-icon error";
    modalIcon.innerHTML = success
      ? '<i class="fa-solid fa-check"></i>'
      : '<i class="fa-solid fa-xmark"></i>';
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = "flex";

    btnModalSiguiente.onclick = () => {
      modal.style.display = "none";
      if (success) loadSection("citas");
    };
  };

  // ============================================================
  // 🔹 SOLICITAR CITA VIEW
  // ============================================================
  const initSolicitarCitaView = () => {
    const btnVolverCitas = document.getElementById("btnVolverCitas");
    const formSolicitarCita = document.getElementById("formSolicitarCita");
    const fechaCita = document.getElementById("fechaCita");

    if (fechaCita) {
      const today = new Date().toISOString().split("T")[0];
      fechaCita.setAttribute("min", today);
    }

    if (btnVolverCitas)
      btnVolverCitas.addEventListener("click", () => loadSection("citas"));

    if (formSolicitarCita)
      formSolicitarCita.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSolicitarCita();
      });
  };

  // ============================================================
  // 🔹 RESULTADOS DE LABORATORIO (con backend)
  // ============================================================
  const getResultados = async () => {
    const email = sessionStorage.getItem("userEmail");
    if (!email) return [];
    try {
      const res = await fetch(`http://localhost:5000/api/resultados?email=${email}`);
      if (!res.ok) throw new Error("Error al obtener resultados");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error obteniendo resultados:", error);
      return [];
    }
  };

  const initResultadosView = async () => {
    const tbody = document.getElementById("pruebas-tbody");
    if (tbody) {
      await renderPruebas();
    }
  };

  const renderPruebas = async () => {
    const tbody = document.getElementById("pruebas-tbody");
    if (!tbody) return;

    const resultados = await getResultados();

    if (resultados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:#666;">No hay resultados de laboratorio disponibles</td></tr>`;
      return;
    }

    tbody.innerHTML = resultados
      .sort((a, b) => new Date(b.fechaResultado) - new Date(a.fechaResultado))
      .map(
        (r) => {
          const fecha = new Date(r.fechaResultado);
          const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          return `
      <tr>
        <td><span class="examen-nombre">${r.tipoExamen}</span></td>
        <td>${fechaFormateada}</td>
        <td><span class="badge ${r.estado || 'disponible'}">${r.estado || 'disponible'}</span></td>
        <td><button class="btn btn-primary" onclick="verResultadoPDF('${r._id}', '${r.tipoExamen}')">Ver Resultados</button></td>
      </tr>
    `;
        }
      )
      .join("");
  };

  window.verResultadoPDF = (id, nombre) => {
    sessionStorage.setItem("currentPDF", JSON.stringify({ id, nombre }));
    loadSection("ver-resultado");
  };

  const initVerResultadoView = () => {
    const pdfData = sessionStorage.getItem("currentPDF");
    if (!pdfData) {
      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = `<p style="color:crimson;padding:2rem;">No se ha seleccionado ningún resultado.</p>`;
      }
      return;
    }
    
    const { id, nombre } = JSON.parse(pdfData);
    const subtitle = document.getElementById("resultado-subtitle");
    const pdfFrame = document.getElementById("pdf-frame");
    
    if (subtitle) subtitle.textContent = `Resultado: ${nombre}`;
    
    if (pdfFrame) {
      // Construir la URL del PDF desde el backend
      pdfFrame.src = `http://localhost:5000/api/resultados/${id}/pdf`;
    }
  };

  // ============================================================
  // 🔹 GESTIÓN DE PERFIL DEL PACIENTE
  // ============================================================
  const initProfileView = async () => {
    const email = sessionStorage.getItem("userEmail");
    if (!email) {
      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = `<p style="color:crimson;padding:2rem;">No se encontró el email del usuario. Por favor, inicie sesión nuevamente.</p>`;
      }
      return;
    }

    await cargarPerfil(email);
    setupProfileEvents();
  };

  const cargarPerfil = async (email) => {
    try {
      const res = await fetch(`http://localhost:5000/api/perfil?email=${email}`);
      if (!res.ok) throw new Error("Error al obtener el perfil");
      const data = await res.json();

      // Actualizar vista de solo lectura
      document.getElementById("profile-name").textContent = `${data.nombres || ""} ${data.apellidos || ""}`.trim() || "Usuario";
      document.getElementById("profile-edad").textContent = data.edad ? `${data.edad} años` : "-";
      
      const generoFormateado = data.genero 
        ? data.genero.charAt(0).toUpperCase() + data.genero.slice(1).replace(/-/g, ' ')
        : "-";
      document.getElementById("profile-genero").textContent = generoFormateado;
      
      const tipoDocFormateado = data.tipo_documento 
        ? data.tipo_documento.toUpperCase().replace(/-/g, ' ')
        : "-";
      document.getElementById("profile-tipo-doc").textContent = tipoDocFormateado;
      
      document.getElementById("profile-num-doc").textContent = data.num_documento || "-";
      document.getElementById("profile-email").textContent = data.email || "-";
      document.getElementById("profile-celular").textContent = data.celular || "-";
      document.getElementById("profile-direccion").textContent = data.direccion || "-";

      // Llenar formulario de edición
      document.getElementById("edit-nombres").value = data.nombres || "";
      document.getElementById("edit-apellidos").value = data.apellidos || "";
      document.getElementById("edit-edad").value = data.edad || "";
      document.getElementById("edit-genero").value = data.genero || "";
      document.getElementById("edit-direccion").value = data.direccion || "";
      document.getElementById("edit-celular").value = data.celular || "";
    } catch (err) {
      console.error("Error cargando perfil:", err);
      alert("Error al cargar el perfil. Por favor, recargue la página.");
    }
  };

  const setupProfileEvents = () => {
    const btnEdit = document.getElementById("btn-edit-profile");
    const btnCancel = document.getElementById("btn-cancel-edit");
    const formEdit = document.getElementById("profile-edit-form");
    const profileView = document.getElementById("profile-view");

    if (btnEdit) {
      btnEdit.addEventListener("click", () => {
        profileView.style.display = "none";
        formEdit.style.display = "block";
        btnEdit.style.display = "none";
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener("click", () => {
        profileView.style.display = "block";
        formEdit.style.display = "none";
        btnEdit.style.display = "block";
        // Recargar datos para restaurar valores originales
        const email = sessionStorage.getItem("userEmail");
        if (email) cargarPerfil(email);
      });
    }

    if (formEdit) {
      formEdit.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = sessionStorage.getItem("userEmail");
        if (!email) {
          alert("No se encontró el email del usuario");
          return;
        }

        const datos = {
          nombres: document.getElementById("edit-nombres").value,
          apellidos: document.getElementById("edit-apellidos").value,
          edad: Number(document.getElementById("edit-edad").value),
          genero: document.getElementById("edit-genero").value,
          direccion: document.getElementById("edit-direccion").value,
          celular: document.getElementById("edit-celular").value,
        };

        try {
          const res = await fetch(`http://localhost:5000/api/perfil?email=${email}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Error al actualizar el perfil");
          }

          alert("Perfil actualizado correctamente");
          profileView.style.display = "block";
          formEdit.style.display = "none";
          btnEdit.style.display = "block";
          
          // Recargar datos actualizados
          await cargarPerfil(email);
        } catch (err) {
          console.error("Error actualizando perfil:", err);
          alert(err.message || "Error al actualizar el perfil");
        }
      });
    }
  };

  // ============================================================
  // 🔹 GESTIÓN DE RESUMEN (OVERVIEW)
  // ============================================================
  const initOverviewView = async () => {
    const email = sessionStorage.getItem("userEmail");
    if (!email) {
      console.error("No se encontró el email del usuario");
      return;
    }

    // Cargar datos
    await cargarProximaCita(email);
    await cargarNuevosResultados(email);
    await cargarMedicacion();

    // Botón nueva cita
    const btnNuevaCita = document.getElementById("btn-nueva-cita");
    if (btnNuevaCita) {
      btnNuevaCita.addEventListener("click", () => {
        loadSection("solicitar-cita");
      });
    }
  };

  const cargarProximaCita = async (email) => {
    try {
      const citas = await getCitas();
      
      if (!citas || citas.length === 0) {
        document.getElementById("proxima-cita-fecha").textContent = "No hay citas agendadas";
        document.getElementById("proxima-cita-detalle").textContent = "Agenda tu primera cita";
        return;
      }

      // Filtrar solo citas futuras y con estado no cancelado
      const ahora = new Date();
      const citasFuturas = citas
        .filter(cita => {
          const fechaCita = new Date(cita.fechaCita);
          return fechaCita >= ahora && cita.estado !== "cancelada";
        })
        .sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));

      if (citasFuturas.length === 0) {
        document.getElementById("proxima-cita-fecha").textContent = "No hay citas próximas";
        document.getElementById("proxima-cita-detalle").textContent = "Todas las citas han pasado o fueron canceladas";
        return;
      }

      const proximaCita = citasFuturas[0];
      const fecha = new Date(proximaCita.fechaCita);
      const fechaFormateada = fecha.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      const hora = proximaCita.horario || "-";

      document.getElementById("proxima-cita-fecha").textContent = `${fechaFormateada} — ${hora}`;
      document.getElementById("proxima-cita-detalle").textContent = `${proximaCita.especialidad} · ${proximaCita.estado || "Pendiente"}`;
    } catch (err) {
      console.error("Error cargando próxima cita:", err);
      document.getElementById("proxima-cita-fecha").textContent = "Error al cargar";
      document.getElementById("proxima-cita-detalle").textContent = "-";
    }
  };

  const cargarNuevosResultados = async (email) => {
    try {
      const res = await fetch(`http://localhost:5000/api/resultados?email=${email}`);
      if (!res.ok) throw new Error("Error al obtener resultados");
      const resultados = await res.json();

      if (!resultados || resultados.length === 0) {
        document.getElementById("card-resultados").style.display = "none";
        return;
      }

      // Filtrar resultados recientes (últimos 7 días)
      const ahora = new Date();
      const sieteDiasAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      const resultadosRecientes = resultados.filter(resultado => {
        const fecha = new Date(resultado.fechaResultado);
        return fecha >= sieteDiasAtras;
      });

      if (resultadosRecientes.length === 0) {
        document.getElementById("card-resultados").style.display = "none";
        return;
      }

      document.getElementById("card-resultados").style.display = "block";
      document.getElementById("resultados-count").textContent = `${resultadosRecientes.length} ${resultadosRecientes.length === 1 ? "resultado nuevo" : "resultados nuevos"}`;
      
      const ultimoResultado = resultadosRecientes[0];
      const fechaUltimo = new Date(ultimoResultado.fechaResultado);
      document.getElementById("resultados-detalle").textContent = `${ultimoResultado.tipoExamen} · ${fechaUltimo.toLocaleDateString("es-ES")}`;
    } catch (err) {
      console.error("Error cargando nuevos resultados:", err);
      document.getElementById("card-resultados").style.display = "none";
    }
  };

  const cargarMedicacion = async () => {
    try {
      // Cargar la vista de medicación para verificar si hay datos
      const res = await fetch("views/medicacion.html");
      if (!res.ok) {
        document.getElementById("card-medicacion").style.display = "none";
        return;
      }
      const html = await res.text();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const medItems = tempDiv.querySelectorAll(".med-item");
      
      if (medItems.length === 0) {
        document.getElementById("card-medicacion").style.display = "none";
        return;
      }

      // Obtener información de la primera medicación
      const primeraMedicacion = medItems[0];
      const nombreMedicacion = primeraMedicacion.querySelector(".med-name")?.textContent || "Medicación";
      
      document.getElementById("card-medicacion").style.display = "block";
      document.getElementById("medicacion-tipo").textContent = nombreMedicacion;
      document.getElementById("medicacion-detalle").textContent = `${medItems.length} ${medItems.length === 1 ? "medicamento activo" : "medicamentos activos"}`;
    } catch (err) {
      console.error("Error cargando medicación:", err);
      document.getElementById("card-medicacion").style.display = "none";
    }
  };

  // ============================================================
  // 🔹 CARGA INICIAL
  // ============================================================
  loadSection("overview");
  if (isMobile()) sidebar.classList.remove("open");
  else sidebar.classList.remove("collapsed");
});

document.addEventListener("DOMContentLoaded", () => {
  const formSolicitarCita = document.getElementById("formSolicitarCita");
  const modalResultado = document.getElementById("modalResultado");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalIcon = document.getElementById("modalIcon");
  const btnModalSiguiente = document.getElementById("btnModalSiguiente");
  const btnVolverCitas = document.getElementById("btnVolverCitas");
  const especialidadSelect = document.getElementById("especialidad");
  const precioEspecialidadDiv = document.getElementById("precioEspecialidad");
  const montoEspecialidadSpan = document.getElementById("montoEspecialidad");

  // Función para obtener precio por especialidad
  const getPrecioEspecialidad = (especialidad) => {
    const precios = {
      "Cardiología": 80.00,
      "Dermatología": 60.00,
      "Pediatría": 50.00,
      "Traumatología": 70.00,
      "Neurología": 90.00,
      "Hematología": 65.00,
      "Inmunología": 75.00,
      "Bioquímica": 55.00,
    };
    return precios[especialidad] || 50.00;
  };

  // ✅ función para mostrar el modal (éxito o error)
  const showModal = (isSuccess, title, message) => {
    modalResultado.style.display = "flex";
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalIcon.innerHTML = isSuccess
      ? '<i class="fa-solid fa-check"></i>'
      : '<i class="fa-solid fa-xmark"></i>';
    modalIcon.style.color = isSuccess ? "green" : "red";
  };

  // ✅ función para cerrar el modal
  const closeModal = () => {
    modalResultado.style.display = "none";
  };

  btnModalSiguiente.addEventListener("click", closeModal);

  // ✅ función para enviar la cita
  const handleSolicitarCita = async (e) => {
    e.preventDefault();

    // obtener los valores del formulario
    const email = sessionStorage.getItem("userEmail"); // debe estar guardado desde el login
    const especialidad = document.getElementById("especialidad").value;
    const fechaCita = document.getElementById("fechaCita").value;
    const horario = document.getElementById("horario").value;
    const motivoCita = document.getElementById("motivoCita").value;

    // validar campos vacíos
    if (!especialidad || !fechaCita || !horario || !motivoCita) {
      showModal(false, "Error", "Por favor complete todos los campos.");
      return;
    }

    // validar email guardado
    if (!email) {
      showModal(false, "Error", "No se encontró el correo del usuario. Inicie sesión nuevamente.");
      return;
    }

    try {
      // enviar la solicitud al backend
      const res = await fetch("http://localhost:5000/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          especialidad,
          fechaCita,
          horario,
          motivoCita,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al registrar la cita");

      // Guardar el ID de la cita en sessionStorage
      if (data.cita && data.cita._id) {
        sessionStorage.setItem('ultimaCitaId', data.cita._id);
        // Redirigir a la página de pago usando window.location si estamos en una página HTML completa
        // o cargar la vista si estamos en el dashboard
        if (window.location.pathname.includes('/user/citas') || window.location.pathname.includes('/user/pagar-cita')) {
          window.location.href = '/user/pagar-cita?citaId=' + data.cita._id;
        } else {
          // Si estamos en el dashboard, cargar la vista de pago
          if (typeof loadSection === 'function') {
            loadSection('pagar-cita');
          } else {
            window.location.href = '/user/pagar-cita?citaId=' + data.cita._id;
          }
        }
      } else {
        showModal(true, "Solicitud Enviada", "Su cita ha sido registrada exitosamente.");
        formSolicitarCita.reset();
      }

    } catch (error) {
      console.error("Error al solicitar cita:", error);
      showModal(false, "Error", "No se pudo registrar la cita. Inténtelo nuevamente.");
    }
  };

  // ✅ detectar envío del formulario solo cuando existe
  if (formSolicitarCita) {
    formSolicitarCita.addEventListener("submit", handleSolicitarCita);
  }

  // ✅ botón para volver al dashboard
  if (btnVolverCitas) {
    btnVolverCitas.addEventListener("click", () => {
      window.location.href = "./dashboardPaciente.html";
    });
  }

  // ✅ Mostrar precio cuando se selecciona una especialidad
  if (especialidadSelect && precioEspecialidadDiv && montoEspecialidadSpan) {
    especialidadSelect.addEventListener("change", (e) => {
      const especialidad = e.target.value;
      if (especialidad) {
        const precio = getPrecioEspecialidad(especialidad);
        montoEspecialidadSpan.textContent = `S/ ${precio.toFixed(2)}`;
        precioEspecialidadDiv.style.display = "block";
      } else {
        precioEspecialidadDiv.style.display = "none";
      }
    });
  }
});

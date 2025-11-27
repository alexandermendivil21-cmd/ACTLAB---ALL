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
    // Si hay un modal de recomendaciones abierto, cerrarlo también
    const modalRecomendaciones = document.getElementById("modalRecomendaciones");
    if (modalRecomendaciones) {
      modalRecomendaciones.style.display = "none";
    }
  };

  // Variable para almacenar la función de callback del botón
  let btnModalSiguienteCallback = closeModal;
  
  btnModalSiguiente.addEventListener("click", () => {
    if (btnModalSiguienteCallback) {
      btnModalSiguienteCallback();
    }
  });

  // ✅ Función para obtener recomendaciones según especialidad y motivo
  const getRecomendaciones = (especialidad, motivoCita) => {
    const recomendaciones = {
      "Cardiología": {
        titulo: "Recomendaciones para Análisis de Cardiología",
        items: [
          "Evitar comer 8–12 horas antes si te pedirán perfil lipídico o glucosa.",
          "No hacer ejercicio fuerte 24 horas antes, porque altera resultados."
        ]
      },
      "Dermatología": {
        titulo: "Recomendaciones para Análisis de Dermatología",
        items: [
          "No aplicar cremas, maquillaje, lociones o pomadas en el área a evaluar antes del examen o raspado.",
          "Evita rascar o manipular la lesión."
        ]
      },
      "Pediatría": {
        titulo: "Recomendaciones para Análisis de Pediatría",
        items: [
          "Mantener al niño bien hidratado y descansado.",
          "No darle antibióticos sin receta antes de exámenes (pueden alterar infecciones en orina/heces).",
          "Traer vaso de orina."
        ]
      },
      "Traumatología": {
        titulo: "Recomendaciones para Análisis de Traumatología",
        items: [
          "Si es análisis preoperatorio: estar en ayunas y no tomar alcohol 48 horas antes.",
          "Evitar antiinflamatorios sin indicación.",
          "Traer vaso de orina."
        ]
      },
      "Neurología": {
        titulo: "Recomendaciones para Análisis de Neurología",
        items: [
          "Traer vaso de orina.",
          "Dormir lo suficiente. La falta de sueño altera glucosa, hormonas y estudios como el EEG.",
          "Evitar cafeína y alcohol 24 horas antes si se harán análisis de sangre."
        ]
      },
      "Hematología": {
        titulo: "Recomendaciones para Análisis de Hematología",
        items: [
          "No consumir alcohol 48 horas antes.",
          "Evitar ejercicio intenso 24 h antes (alteran hemoglobina y plaquetas).",
          "Si es ayunas, solo agua."
        ]
      },
      "Inmunología": {
        titulo: "Recomendaciones para Análisis de Inmunología",
        items: [
          "No tomar antihistamínicos 5–7 días antes si te harán pruebas de alergia.",
          "No vacunarte 1–2 semanas antes de un perfil inmunológico (puede alterar anticuerpos).",
          "Traer vaso de orina."
        ]
      },
      "Bioquímica": {
        titulo: "Recomendaciones para Análisis de Bioquímica",
        items: [
          "Estar en ayunas 8–12 horas para exámenes de glucosa, triglicéridos, colesterol.",
          "No fumar ni tomar café esa mañana.",
          "Traer vaso de orina."
        ]
      }
    };

    // Si es análisis, devolver recomendaciones según la especialidad
    if (motivoCita === "Análisis" || motivoCita === "Para sacar análisis") {
      return recomendaciones[especialidad] || {
        titulo: "Recomendaciones para Análisis",
        items: [
          "Ayune por al menos 8-12 horas antes del análisis (si es análisis de sangre).",
          "Mantenga una dieta normal el día anterior, evite alimentos grasos.",
          "Beba agua normalmente, pero evite alcohol 24 horas antes.",
          "Informe al personal si está tomando algún medicamento.",
          "Lleve su documento de identidad y orden médica si la tiene.",
          "Use ropa cómoda con mangas que se puedan subir fácilmente.",
          "Evite hacer ejercicio intenso el día anterior."
        ]
      };
    }

    // Si no es análisis, devolver recomendaciones generales
    return {
      titulo: "Recomendaciones Generales",
      items: [
        "Lleve su documento de identidad.",
        "Traiga una lista de medicamentos que está tomando.",
        "Anote los síntomas que ha experimentado.",
        "Llegue 10 minutos antes de su cita.",
        "Use ropa cómoda."
      ]
    };
  };

  // ✅ Función para mostrar modal de recomendaciones
  const showModalRecomendaciones = (especialidad, motivoCita) => {
    const recomendaciones = getRecomendaciones(especialidad, motivoCita);
    
    // Crear o obtener el modal de recomendaciones
    let modalRecomendaciones = document.getElementById("modalRecomendaciones");
    
    if (!modalRecomendaciones) {
      // Crear el modal si no existe
      modalRecomendaciones = document.createElement("div");
      modalRecomendaciones.id = "modalRecomendaciones";
      modalRecomendaciones.className = "modal-overlay";
      modalRecomendaciones.style.display = "none";
      modalRecomendaciones.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto; background: white; border-radius: 12px; padding: 2rem; position: relative;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="width: 60px; height: 60px; margin: 0 auto 1rem; background: #1976d2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <i class="fa-solid fa-lightbulb" style="color: white; font-size: 1.5rem;"></i>
            </div>
            <h2 id="modalRecomendacionesTitulo" style="margin: 0; color: #1976d2; font-size: 1.5rem; font-weight: 600;"></h2>
          </div>
          <div id="modalRecomendacionesLista" style="margin-bottom: 1.5rem;"></div>
          <button class="btn-primary" id="btnCerrarRecomendaciones" style="width: 100%; padding: 0.75rem; font-size: 1rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; background: #1976d2; color: white;">
            Entendido
          </button>
        </div>
      `;
      document.body.appendChild(modalRecomendaciones);

      // Cerrar al hacer clic fuera del modal
      modalRecomendaciones.addEventListener("click", (e) => {
        if (e.target === modalRecomendaciones) {
          modalRecomendaciones.style.display = "none";
        }
      });
    }

    // Llenar el contenido
    document.getElementById("modalRecomendacionesTitulo").textContent = recomendaciones.titulo;
    const lista = document.getElementById("modalRecomendacionesLista");
    lista.innerHTML = `
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
        <ul style="margin: 0; padding-left: 1.5rem; color: #333;">
          ${recomendaciones.items.map(item => `<li style="margin-bottom: 0.75rem; line-height: 1.6;">${item}</li>`).join('')}
        </ul>
      </div>
    `;

    // Mostrar el modal
    modalRecomendaciones.style.display = "flex";
  };

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

      if (!res.ok) {
        // Si hay un error de cita de la misma especialidad en la misma fecha
        if (res.status === 409 && data.tipoError === "cita_misma_especialidad_fecha") {
          throw new Error("Ya tienes una cita registrada para esta fecha");
        }
        throw new Error(data.error || data.message || "Error al registrar la cita");
      }

      // Guardar el ID de la cita en sessionStorage
      if (data.cita && data.cita._id) {
        sessionStorage.setItem('ultimaCitaId', data.cita._id);
      }
      
      // Mostrar modal de éxito primero
      showModal(true, "Cita Registrada", "Su cita ha sido registrada exitosamente.");
      
      // Configurar callback para mostrar recomendaciones después del modal de éxito
      btnModalSiguienteCallback = () => {
        closeModal();
        // Mostrar modal de recomendaciones
        showModalRecomendaciones(especialidad, motivoCita);
        
        // Configurar callback para cerrar recomendaciones y redirigir
        const btnCerrarRecomendaciones = document.getElementById("btnCerrarRecomendaciones");
        if (btnCerrarRecomendaciones) {
          // Remover listeners anteriores
          const newBtn = btnCerrarRecomendaciones.cloneNode(true);
          btnCerrarRecomendaciones.parentNode.replaceChild(newBtn, btnCerrarRecomendaciones);
          
          newBtn.addEventListener("click", () => {
            const modalRecomendaciones = document.getElementById("modalRecomendaciones");
            if (modalRecomendaciones) {
              modalRecomendaciones.style.display = "none";
            }
            // Redirigir a la lista de citas
            if (typeof loadSection === 'function') {
              loadSection("citas");
            } else {
              window.location.href = "./dashboardPaciente.html";
            }
          });
        }
      };
      
      // Limpiar el formulario
      formSolicitarCita.reset();

    } catch (error) {
      console.error("Error al solicitar cita:", error);
      showModal(false, "Error", error.message || "No se pudo registrar la cita. Inténtelo nuevamente.");
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

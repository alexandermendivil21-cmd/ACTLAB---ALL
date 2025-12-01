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

  // Función para crear y mostrar el modal de confirmación de cierre de sesión
  const mostrarModalCerrarSesion = function(callback) {
    // Crear el modal si no existe
    let modal = document.getElementById("modal-logout");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "modal-logout";
      modal.className = "modal-logout-overlay";
      modal.innerHTML = `
        <div class="modal-logout-content">
          <div class="modal-logout-icon">
            <i class="fa-solid fa-right-from-bracket"></i>
          </div>
          <h3 class="modal-logout-title">¿Cerrar Sesión?</h3>
          <p class="modal-logout-message">¿Está seguro que desea cerrar sesión? Deberá iniciar sesión nuevamente para acceder.</p>
          <div class="modal-logout-actions">
            <button class="btn-logout-cancel" id="btnLogoutCancel">
              <i class="fa-solid fa-xmark"></i> Cancelar
            </button>
            <button class="btn-logout-confirm" id="btnLogoutConfirm">
              <i class="fa-solid fa-sign-out-alt"></i> Cerrar Sesión
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Agregar estilos si no existen
      if (!document.getElementById("modal-logout-styles")) {
        const style = document.createElement("style");
        style.id = "modal-logout-styles";
        style.textContent = `
          .modal-logout-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10000;
            animation: fadeInLogout 0.3s ease;
            backdrop-filter: blur(4px);
          }

          .modal-logout-overlay.hidden {
            display: none;
          }

          @keyframes fadeInLogout {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .modal-logout-content {
            background: #ffffff;
            padding: 2.5rem;
            border-radius: 16px;
            width: 90%;
            max-width: 420px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUpLogout 0.3s ease;
            text-align: center;
          }

          @keyframes slideUpLogout {
            from {
              transform: translateY(30px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .modal-logout-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
          }

          .modal-logout-icon i {
            font-size: 2rem;
            color: #ffffff;
          }

          .modal-logout-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 0.75rem 0;
          }

          .modal-logout-message {
            font-size: 0.95rem;
            color: #6b7280;
            line-height: 1.6;
            margin: 0 0 2rem 0;
          }

          .modal-logout-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }

          .btn-logout-cancel,
          .btn-logout-confirm {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .btn-logout-cancel {
            background: #f3f4f6;
            color: #374151;
          }

          .btn-logout-cancel:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .btn-logout-confirm {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }

          .btn-logout-confirm:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
          }

          .btn-logout-cancel:active,
          .btn-logout-confirm:active {
            transform: translateY(0);
          }

          @media (max-width: 480px) {
            .modal-logout-content {
              padding: 2rem 1.5rem;
            }

            .modal-logout-actions {
              flex-direction: column;
            }

            .btn-logout-cancel,
            .btn-logout-confirm {
              width: 100%;
              justify-content: center;
            }
          }
        `;
        document.head.appendChild(style);
      }

      // Event listeners
      const btnCancel = document.getElementById("btnLogoutCancel");
      const btnConfirm = document.getElementById("btnLogoutConfirm");

      btnCancel.addEventListener("click", () => {
        modal.classList.add("hidden");
      });

      btnConfirm.addEventListener("click", () => {
        modal.classList.add("hidden");
        if (callback) callback();
      });

      // Cerrar al hacer clic fuera del modal
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
        }
      });

      // Cerrar con ESC
      const handleEsc = (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          modal.classList.add("hidden");
          document.removeEventListener("keydown", handleEsc);
        }
      };
      document.addEventListener("keydown", handleEsc);
    }

    // Mostrar el modal
    modal.classList.remove("hidden");
  };

  // Función global para cerrar sesión (disponible para cualquier usuario)
  window.cerrarSesion = function() {
    mostrarModalCerrarSesion(() => {
      // Limpiar todos los datos de sessionStorage
      sessionStorage.clear();
      
      // Limpiar datos específicos de localStorage relacionados con la sesión
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userCargo");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userNombres");
      localStorage.removeItem("userApellidos");
      
      // Limpiar recordatorios de medicación si existen (opcional, comentado para mantenerlos)
      // localStorage.removeItem("recordatorios");
      
      // Mantener datos de "recordar" del login si el usuario los configuró
      // (no se eliminan para mantener la comodidad del usuario)
      
      // Redirigir al login
      window.location.href = "/login";
    });
  };

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

          // Ejecutar scripts inline si existen
          const scripts = content.querySelectorAll('script');
          scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
          });

          // Inicializar vistas específicas
          if (section === "citas") initCitasView();
          else if (section === "solicitar-cita") initSolicitarCitaView();
          else if (section === "pagar-cita") initPagarCitaView();
          else if (section === "resultados") initResultadosView();
          else if (section === "ver-resultado") initVerResultadoView();
          else if (section === "profile") initProfileView();
          else if (section === "overview") initOverviewView();
          else if (section === "pagos") initPagosView();
          else if (section === "medicacion") initMedicacionView();
          else if (section === "historial") initHistorialView();
          else if (section === "doctores") initDoctoresView();
          else if (section === "perfil-doctor") initPerfilDoctorView();
        }, 180);
      })
      .catch((err) => {
        console.error("Error cargando vista", section, err);
        content.innerHTML = `<p style="color:crimson">Error al cargar la vista "${section}".</p>`;
      });
  };

  // Hacer loadSection global para que esté disponible desde los botones
  window.loadSection = loadSection;

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
        cerrarSesion();
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
      // Al obtener citas, el backend cancelará automáticamente las no pagadas que ya pasaron
      const res = await fetch(`http://localhost:5000/api/citas?email=${email}`);
      if (!res.ok) throw new Error("Error al obtener citas");
      const data = await res.json();
      
      // El backend ya canceló las citas no pagadas, pero verificamos por si acaso
      // y mostramos notificación si alguna cita fue cancelada automáticamente
      const ahora = new Date();
      let citasCanceladasAutomaticamente = 0;
      
      for (const cita of data) {
        // Si la cita fue cancelada automáticamente por el sistema
        if (cita.estado && cita.estado.toLowerCase() === "cancelada" && cita.canceladaPor === "sistema") {
          const fechaCita = new Date(cita.fechaCita);
          const horarioParts = cita.horario ? cita.horario.split(':') : ['0', '0'];
          const horaCita = parseInt(horarioParts[0]) || 0;
          const minutosCita = parseInt(horarioParts[1]) || 0;
          fechaCita.setHours(horaCita, minutosCita, 0, 0);
          
          // Si la cita ya pasó y fue cancelada por el sistema, incrementar contador
          if (fechaCita < ahora) {
            citasCanceladasAutomaticamente++;
          }
        }
      }
      
      // Mostrar notificación si hay citas canceladas automáticamente
      if (citasCanceladasAutomaticamente > 0) {
        const mensaje = citasCanceladasAutomaticamente === 1
          ? "Una de tus citas fue cancelada automáticamente por no haber sido pagada antes de la hora de la cita."
          : `${citasCanceladasAutomaticamente} de tus citas fueron canceladas automáticamente por no haber sido pagadas antes de la hora de la cita.`;
        
        // Mostrar notificación informativa
        setTimeout(() => {
          const notification = document.createElement("div");
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 1.25rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
            z-index: 10001;
            max-width: 420px;
            animation: slideInRightNotificationCancel 0.4s ease;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
          `;
          notification.innerHTML = `
            <div style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="fa-solid fa-info-circle" style="font-size: 1.25rem; color: white;"></i>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 1.1rem; font-weight: 700; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-clock"></i>
                Cita Cancelada Automáticamente
              </div>
              <div style="font-size: 0.95rem; line-height: 1.5; margin: 0; opacity: 0.95;">${mensaje}</div>
            </div>
            <button onclick="this.closest('div').remove()" style="background: rgba(255, 255, 255, 0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          `;
          
          // Agregar animación si no existe
          if (!document.getElementById("notification-cancel-auto-styles")) {
            const style = document.createElement("style");
            style.id = "notification-cancel-auto-styles";
            style.textContent = `
              @keyframes slideInRightNotificationCancel {
                from {
                  transform: translateX(120%);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }
            `;
            document.head.appendChild(style);
          }
          
          document.body.appendChild(notification);
          
          // Auto-ocultar después de 8 segundos
          setTimeout(() => {
            notification.style.animation = "slideOutRightNotificationEdit 0.4s ease";
            setTimeout(() => notification.remove(), 400);
          }, 8000);
        }, 500);
      }
      
      return data;
    } catch (error) {
      console.error("❌ Error obteniendo citas:", error);
      return [];
    }
  };

  // ============================================================
  // 🔹 OBTENER PRECIO POR ESPECIALIDAD (GLOBAL)
  // ============================================================
  window.getPrecioEspecialidad = (especialidad) => {
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
    return precios[especialidad] || 50.00; // Precio por defecto
  };

  const renderCitas = (citas, citasConPago = new Set()) => {
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
      const precio = getPrecioEspecialidad(especialidad);
      const citaIdStr = cita._id.toString();
      const tienePago = citasConPago.has(citaIdStr);
      const estaCancelada = estado.toLowerCase() === "cancelada";
      const estaCompletada = estado.toLowerCase() === "completada";
      const intentosEdicion = cita.intentosEdicion || 0;
      const limiteAlcanzado = intentosEdicion >= 2;
      
      // Escapar comillas para evitar problemas en el HTML
      const especialidadEscapada = especialidad.replace(/'/g, "\\'");
      const motivoEscapado = motivo.replace(/'/g, "\\'");
      
      // Determinar el color del estado según el estado de la cita
      let estadoClass = "warning"; // Amarillo por defecto (pendiente)
      let estadoColor = "#f59e0b"; // Amarillo
      const estadoLower = estado.toLowerCase();
      
      if (estadoLower === "completada") {
        estadoClass = "success";
        estadoColor = "#22c55e"; // Verde
      } else if (estadoLower === "confirmada") {
        estadoClass = "primary";
        estadoColor = "#1976d2"; // Azul
      } else if (estadoLower === "pendiente") {
        estadoClass = "warning";
        estadoColor = "#f59e0b"; // Amarillo
      } else if (estadoLower === "cancelada") {
        estadoClass = "danger";
        estadoColor = "#e74c3c"; // Rojo
      }
      
      // Determinar si los botones deben estar desactivados
      // Si la cita está completada, desactivar todas las opciones excepto ver recomendaciones
      const pagarDeshabilitado = tienePago || estaCancelada || estaCompletada;
      const editarDeshabilitado = tienePago || estaCancelada || estaCompletada || limiteAlcanzado;
      const cancelarDeshabilitado = tienePago || estaCancelada || estaCompletada;

      // Verificar si hay diagnósticos, resultados o recetas relacionados
      const tieneDiagnosticos = cita.diagnosticos && cita.diagnosticos.length > 0;
      const tieneResultados = cita.resultados && cita.resultados.length > 0;
      const tieneRecetas = tieneDiagnosticos && cita.diagnosticos.some(diag => diag.tieneReceta && diag.receta.length > 0);

      return `
      <div class="cita-card">
        <div class="cita-info">
          <div class="cita-date">${fecha} | ${horario}</div>
          <div class="cita-detail"><strong>Especialidad:</strong> ${especialidad}</div>
          <div class="cita-detail"><strong>Motivo:</strong> ${motivo}</div>
          <div class="cita-detail"><strong>Estado:</strong> <span class="chip ${estadoClass}" style="background: ${estadoColor}; color: white; text-transform: capitalize;">${estado}</span></div>
          <div class="cita-detail" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
            ${tienePago 
              ? '<strong style="color: #059669; font-size: 1.125rem;"><i class="fa-solid fa-check-circle"></i> Pago realizado: S/ ' + precio.toFixed(2) + '</strong>'
              : '<strong style="color: #059669; font-size: 1.125rem;">Monto a pagar: S/ ' + precio.toFixed(2) + '</strong>'
            }
          </div>
          ${(tieneDiagnosticos || tieneResultados) ? `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e5e7eb;">
              ${tieneDiagnosticos ? `
                <div style="margin-bottom: ${tieneResultados ? '1.5rem' : '0'};">
                  <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #1976d2; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-user-doctor"></i>
                    Consultas médicas relacionadas (${cita.diagnosticos.length})
                  </h4>
                  ${cita.diagnosticos.map((diag, idx) => {
                    const fechaDiag = new Date(diag.fecha).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    });
                    return `
                      <div style="margin-bottom: ${idx < cita.diagnosticos.length - 1 ? '1rem' : '0'}; padding: 0.75rem; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #1976d2;">
                        <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem;">
                          ${diag.medico ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Médico:</strong>
                              <span style="color: #555;">${diag.medico}</span>
                            </div>
                          ` : ''}
                          ${diag.especialidad ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Especialidad:</strong>
                              <span style="color: #555;">${diag.especialidad}</span>
                            </div>
                          ` : ''}
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Fecha:</strong>
                            <span style="color: #555;">${fechaDiag}</span>
                          </div>
                          ${diag.diagnostico ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Diagnóstico:</strong>
                              <span style="color: #555;">${diag.diagnostico}</span>
                            </div>
                          ` : ''}
                          ${diag.sintomas ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Síntomas:</strong>
                              <span style="color: #555;">${diag.sintomas}</span>
                            </div>
                          ` : ''}
                          ${diag.observaciones ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Observaciones:</strong>
                              <span style="color: #555;">${diag.observaciones}</span>
                            </div>
                          ` : ''}
                          ${diag.tieneReceta && diag.receta.length > 0 ? `
                            <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #dee2e6;">
                              <strong style="color: #333; display: block; margin-bottom: 0.5rem;">Medicación prescrita:</strong>
                              <ul style="margin: 0; padding-left: 1.5rem; color: #555;">
                                ${diag.receta.map(med => `
                                  <li>${med.nombre} - ${med.dosis} (${med.frecuencia}) por ${med.duracion}</li>
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
                <div>
                  <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #1976d2; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-vials"></i>
                    Resultados de análisis relacionados (${cita.resultados.length})
                  </h4>
                  ${cita.resultados.map((res, idx) => {
                    const fechaRes = new Date(res.fecha).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    });
                    const urlResultado = res.archivoPDF ? `http://localhost:5000${res.archivoPDF}` : '';
                    return `
                      <div style="margin-bottom: ${idx < cita.resultados.length - 1 ? '1rem' : '0'}; padding: 0.75rem; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #1976d2;">
                        <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem;">
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Tipo de examen:</strong>
                            <span style="color: #555;">${res.tipoExamen || 'N/A'}</span>
                          </div>
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Fecha:</strong>
                            <span style="color: #555;">${fechaRes}</span>
                          </div>
                          ${res.observaciones ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Observaciones:</strong>
                              <span style="color: #555;">${res.observaciones}</span>
                            </div>
                          ` : ''}
                          ${res.estado ? `
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Estado:</strong>
                              <span style="color: #555; text-transform: capitalize;">${res.estado}</span>
                            </div>
                          ` : ''}
                          ${urlResultado ? `
                            <div style="margin-top: 0.5rem;">
                              <a href="javascript:void(0)" onclick="window.verResultadoPDF('${res.id}', '${res.nombreArchivo || 'Resultado'}')" style="display: inline-flex; align-items: center; gap: 0.4rem; color: #1976d2; text-decoration: none; font-weight: 500; cursor: pointer;">
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
          ` : ''}
        </div>
        <div class="cita-actions">
          <button 
            class="chip" 
            onclick="window.showModalRecomendaciones('${especialidadEscapada.replace(/'/g, "\\'")}', '${motivoEscapado.replace(/'/g, "\\'")}')"
            style="background: #1976d2; color: white; border: none; font-weight: 600; cursor: pointer; margin-bottom: 0.5rem;">
            <i class="fa-solid fa-lightbulb"></i> Recomendaciones
          </button>
          <button 
            class="chip" 
            onclick="${pagarDeshabilitado ? '' : `pagarCita('${cita._id}')`}" 
            ${pagarDeshabilitado ? 'disabled' : ''}
            style="background: ${pagarDeshabilitado ? '#9ca3af' : '#059669'}; color: white; border: none; font-weight: 600; cursor: ${pagarDeshabilitado ? 'not-allowed' : 'pointer'}; opacity: ${pagarDeshabilitado ? '0.6' : '1'};">
            <i class="fa-solid fa-credit-card"></i> ${tienePago ? 'Pagado' : 'Pagar'}
          </button>
          <button 
            class="chip" 
            onclick="${editarDeshabilitado ? '' : `editarCitaPrompt('${cita._id}')`}" 
            ${editarDeshabilitado ? 'disabled' : ''}
            style="background: ${editarDeshabilitado ? '#9ca3af' : '#3b82f6'}; color: white; border: none; cursor: ${editarDeshabilitado ? 'not-allowed' : 'pointer'}; opacity: ${editarDeshabilitado ? '0.6' : '1'};">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          <button 
            class="chip danger" 
            onclick="${cancelarDeshabilitado ? '' : `cancelarCita('${cita._id}')`}" 
            ${cancelarDeshabilitado ? 'disabled' : ''}
            style="background: ${cancelarDeshabilitado ? '#9ca3af' : '#ef4444'}; color: white; border: none; cursor: ${cancelarDeshabilitado ? 'not-allowed' : 'pointer'}; opacity: ${cancelarDeshabilitado ? '0.6' : '1'};">
            <i class="fa-solid fa-ban"></i> Cancelar
          </button>
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
      const email = sessionStorage.getItem("userEmail");
      const citas = await getCitas();
      
      // Obtener pagos existentes para verificar qué citas ya tienen pago
      let citasConPago = new Set();
      if (email) {
        try {
          const resPagos = await fetch(`http://localhost:5000/api/pagos?email=${encodeURIComponent(email)}`);
          if (resPagos.ok) {
            const pagos = await resPagos.json();
            pagos.forEach(pago => {
              if (pago.citaId) {
                const citaId = typeof pago.citaId === 'object' && pago.citaId._id 
                  ? pago.citaId._id.toString() 
                  : pago.citaId.toString();
                citasConPago.add(citaId);
              }
            });
          }
        } catch (error) {
          console.warn('Error al verificar pagos:', error);
        }
      }
      
      renderCitas(citas, citasConPago);
    }
  };

  // Función auxiliar para recargar citas con pagos
  const recargarCitasConPagos = async () => {
    const email = sessionStorage.getItem("userEmail");
    const citas = await getCitas();
    
    // Obtener pagos existentes para verificar qué citas ya tienen pago
    let citasConPago = new Set();
    if (email) {
      try {
        const resPagos = await fetch(`http://localhost:5000/api/pagos?email=${encodeURIComponent(email)}`);
        if (resPagos.ok) {
          const pagos = await resPagos.json();
          pagos.forEach(pago => {
            if (pago.citaId) {
              const citaId = typeof pago.citaId === 'object' && pago.citaId._id 
                ? pago.citaId._id.toString() 
                : pago.citaId.toString();
              citasConPago.add(citaId);
            }
          });
        }
      } catch (error) {
        console.warn('Error al verificar pagos:', error);
      }
    }
    
    renderCitas(citas, citasConPago);
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
      await recargarCitasConPagos();
    } catch (e) {
      alert(e.message);
    }
  };

  // Función para mostrar ventana emergente (modal) de alerta
  const mostrarModalAlerta = (titulo, mensaje, tipo = "info") => {
    // Crear modal si no existe
    let modalAlerta = document.getElementById("modal-alerta-intentos");
    if (!modalAlerta) {
      modalAlerta = document.createElement("div");
      modalAlerta.id = "modal-alerta-intentos";
      modalAlerta.className = "modal-alerta-overlay";
      document.body.appendChild(modalAlerta);

      // Agregar estilos si no existen
      if (!document.getElementById("modal-alerta-styles")) {
        const style = document.createElement("style");
        style.id = "modal-alerta-styles";
        style.textContent = `
          .modal-alerta-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10002;
            animation: fadeInAlerta 0.3s ease;
            backdrop-filter: blur(4px);
          }

          @keyframes fadeInAlerta {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-alerta-content {
            background: #ffffff;
            padding: 2rem;
            border-radius: 16px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUpAlerta 0.3s ease;
          }

          @keyframes slideUpAlerta {
            from {
              transform: translateY(30px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .modal-alerta-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .modal-alerta-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: white;
          }

          .modal-alerta-icon.warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          }

          .modal-alerta-icon.error {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }

          .modal-alerta-icon.info {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }

          .modal-alerta-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin: 0;
          }

          .modal-alerta-message {
            color: #4b5563;
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }

          .modal-alerta-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
          }

          .btn-modal-alerta {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-modal-alerta-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
          }

          .btn-modal-alerta-primary:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
        `;
        document.head.appendChild(style);
      }
    }

    // Configurar icono según el tipo
    const iconos = {
      warning: { icon: "fa-exclamation-triangle", clase: "warning" },
      error: { icon: "fa-xmark-circle", clase: "error" },
      info: { icon: "fa-info-circle", clase: "info" }
    };

    const config = iconos[tipo] || iconos.info;

    // Actualizar contenido del modal
    modalAlerta.innerHTML = `
      <div class="modal-alerta-content">
        <div class="modal-alerta-header">
          <div class="modal-alerta-icon ${config.clase}">
            <i class="fa-solid ${config.icon}"></i>
          </div>
          <h3 class="modal-alerta-title">${titulo}</h3>
        </div>
        <p class="modal-alerta-message">${mensaje}</p>
        <div class="modal-alerta-actions">
          <button class="btn-modal-alerta btn-modal-alerta-primary" id="btnCerrarModalAlerta">
            Aceptar
          </button>
        </div>
      </div>
    `;

    // Mostrar modal
    modalAlerta.style.display = "flex";

    // Cerrar modal al hacer clic en el botón
    const btnCerrar = document.getElementById("btnCerrarModalAlerta");
    btnCerrar.onclick = () => {
      modalAlerta.style.display = "none";
    };

    // Cerrar modal al hacer clic fuera del contenido
    modalAlerta.onclick = (e) => {
      if (e.target === modalAlerta) {
        modalAlerta.style.display = "none";
      }
    };
  };

  // Función para crear y mostrar el modal de editar cita
  const mostrarModalEditarCita = async function(citaId) {
    try {
      // Obtener información de la cita
      const email = sessionStorage.getItem("userEmail");
      const res = await fetch(`http://localhost:5000/api/citas?email=${email}`);
      if (!res.ok) throw new Error('Error al obtener información de la cita');
      const citas = await res.json();
      const cita = citas.find(c => c._id === citaId);
      
      if (!cita) {
        alert('No se encontró la información de la cita');
        return;
      }

      // Verificar límite de intentos de edición
      const intentosEdicion = cita.intentosEdicion || 0;
      if (intentosEdicion >= 2) {
        mostrarModalAlerta(
          "Límite de intentos alcanzado",
          "Ya no tienes más intento de cambios en tu cita",
          "error"
        );
        return;
      }

      // Formatear fecha actual para el input (YYYY-MM-DD)
      const fechaActual = cita.fechaCita 
        ? new Date(cita.fechaCita).toISOString().split('T')[0]
        : '';
      const horarioActual = cita.horario || '';

      // Crear el modal si no existe
      let modal = document.getElementById("modal-editar-cita");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-editar-cita";
        modal.className = "modal-editar-cita-overlay";
        document.body.appendChild(modal);

        // Agregar estilos si no existen
        if (!document.getElementById("modal-editar-cita-styles")) {
          const style = document.createElement("style");
          style.id = "modal-editar-cita-styles";
          style.textContent = `
            .modal-editar-cita-overlay {
              position: fixed;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, 0.6);
              z-index: 10000;
              animation: fadeInEditCita 0.3s ease;
              backdrop-filter: blur(4px);
            }

            .modal-editar-cita-overlay.hidden {
              display: none;
            }

            @keyframes fadeInEditCita {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            .modal-editar-cita-content {
              background: #ffffff;
              padding: 2.5rem;
              border-radius: 16px;
              width: 90%;
              max-width: 480px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              animation: slideUpEditCita 0.3s ease;
            }

            @keyframes slideUpEditCita {
              from {
                transform: translateY(30px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }

            .modal-editar-cita-header {
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-bottom: 1.5rem;
              padding-bottom: 1rem;
              border-bottom: 2px solid #e5e7eb;
            }

            .modal-editar-cita-icon {
              width: 50px;
              height: 50px;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }

            .modal-editar-cita-icon i {
              font-size: 1.5rem;
              color: #ffffff;
            }

            .modal-editar-cita-title {
              font-size: 1.5rem;
              font-weight: 700;
              color: #1f2937;
              margin: 0;
            }

            .modal-editar-cita-form {
              display: flex;
              flex-direction: column;
              gap: 1.25rem;
            }

            .form-group-edit-cita {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
            }

            .form-group-edit-cita label {
              font-size: 0.95rem;
              font-weight: 600;
              color: #374151;
            }

            .form-group-edit-cita input {
              padding: 0.75rem;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              font-size: 0.95rem;
              font-family: inherit;
              transition: all 0.2s ease;
              background: #ffffff;
            }

            .form-group-edit-cita input:focus {
              outline: none;
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .form-group-edit-cita select {
              padding: 0.75rem;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              font-size: 0.95rem;
              font-family: inherit;
              transition: all 0.2s ease;
              background: #ffffff;
              cursor: pointer;
              appearance: none;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
              background-repeat: no-repeat;
              background-position: right 0.75rem center;
              background-size: 12px;
              padding-right: 2.5rem;
            }

            .form-group-edit-cita select:focus {
              outline: none;
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .form-group-edit-cita select:hover {
              border-color: #d1d5db;
            }

            .modal-editar-cita-actions {
              display: flex;
              gap: 1rem;
              justify-content: flex-end;
              margin-top: 0.5rem;
            }

            .btn-edit-cita-cancel,
            .btn-edit-cita-save {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 8px;
              font-size: 0.95rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }

            .btn-edit-cita-cancel {
              background: #f3f4f6;
              color: #374151;
            }

            .btn-edit-cita-cancel:hover {
              background: #e5e7eb;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .btn-edit-cita-save {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: #ffffff;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }

            .btn-edit-cita-save:hover {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              transform: translateY(-1px);
              box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }

            .btn-edit-cita-save:disabled {
              background: #9ca3af;
              cursor: not-allowed;
              transform: none;
              box-shadow: none;
            }

            .btn-edit-cita-cancel:active,
            .btn-edit-cita-save:active {
              transform: translateY(0);
            }

            .modal-editar-cita-error {
              background: #fef2f2;
              border: 1px solid #fecaca;
              color: #991b1b;
              padding: 0.75rem;
              border-radius: 8px;
              font-size: 0.9rem;
              display: none;
              margin-bottom: 1rem;
            }

            .modal-editar-cita-error.show {
              display: block;
            }

            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }

            @keyframes slideOutRight {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(100%);
                opacity: 0;
              }
            }

            @media (max-width: 480px) {
              .modal-editar-cita-content {
                padding: 2rem 1.5rem;
              }

              .modal-editar-cita-actions {
                flex-direction: column;
              }

              .btn-edit-cita-cancel,
              .btn-edit-cita-save {
                width: 100%;
                justify-content: center;
              }
            }
          `;
          document.head.appendChild(style);
        }
      }

      // Actualizar contenido del modal con datos de la cita
      modal.innerHTML = `
        <div class="modal-editar-cita-content">
          <div class="modal-editar-cita-header">
            <div class="modal-editar-cita-icon">
              <i class="fa-solid fa-calendar-pen"></i>
            </div>
            <h3 class="modal-editar-cita-title">Editar Cita</h3>
          </div>
          <div class="modal-editar-cita-error" id="errorEditCita"></div>
          <form class="modal-editar-cita-form" id="formEditarCita">
            <div class="form-group-edit-cita">
              <label for="fechaCitaEdit">
                <i class="fa-solid fa-calendar-days"></i> Nueva Fecha
              </label>
              <input 
                type="date" 
                id="fechaCitaEdit" 
                name="fechaCita" 
                value="${fechaActual}"
                required
                min="${new Date().toISOString().split('T')[0]}"
              >
            </div>
            <div class="form-group-edit-cita">
              <label for="horarioCitaEdit">
                <i class="fa-solid fa-clock"></i> Nuevo Horario
              </label>
              <select 
                id="horarioCitaEdit" 
                name="horario" 
                required
              >
                <option value="">Seleccione un horario</option>
                <option value="8:00 - 8:30 am" ${horarioActual === "8:00 - 8:30 am" ? "selected" : ""}>8:00 - 8:30 am</option>
                <option value="8:30 - 9:00 am" ${horarioActual === "8:30 - 9:00 am" ? "selected" : ""}>8:30 - 9:00 am</option>
                <option value="9:00 - 9:30 am" ${horarioActual === "9:00 - 9:30 am" ? "selected" : ""}>9:00 - 9:30 am</option>
                <option value="9:30 - 10:00 am" ${horarioActual === "9:30 - 10:00 am" ? "selected" : ""}>9:30 - 10:00 am</option>
                <option value="10:00 - 10:30 am" ${horarioActual === "10:00 - 10:30 am" ? "selected" : ""}>10:00 - 10:30 am</option>
                <option value="10:30 - 11:00 am" ${horarioActual === "10:30 - 11:00 am" ? "selected" : ""}>10:30 - 11:00 am</option>
                <option value="11:00 - 11:30 am" ${horarioActual === "11:00 - 11:30 am" ? "selected" : ""}>11:00 - 11:30 am</option>
                <option value="11:30 - 12:00 pm" ${horarioActual === "11:30 - 12:00 pm" ? "selected" : ""}>11:30 - 12:00 pm</option>
                <option value="12:00 - 12:30 pm" ${horarioActual === "12:00 - 12:30 pm" ? "selected" : ""}>12:00 - 12:30 pm</option>
                <option value="12:30 - 1:00 pm" ${horarioActual === "12:30 - 1:00 pm" ? "selected" : ""}>12:30 - 1:00 pm</option>
                <option value="1:00 - 1:30 pm" ${horarioActual === "1:00 - 1:30 pm" ? "selected" : ""}>1:00 - 1:30 pm</option>
                <option value="1:30 - 2:00 pm" ${horarioActual === "1:30 - 2:00 pm" ? "selected" : ""}>1:30 - 2:00 pm</option>
                <option value="2:00 - 2:30 pm" ${horarioActual === "2:00 - 2:30 pm" ? "selected" : ""}>2:00 - 2:30 pm</option>
                <option value="2:30 - 3:00 pm" ${horarioActual === "2:30 - 3:00 pm" ? "selected" : ""}>2:30 - 3:00 pm</option>
                <option value="3:00 - 3:30 pm" ${horarioActual === "3:00 - 3:30 pm" ? "selected" : ""}>3:00 - 3:30 pm</option>
                <option value="3:30 - 4:00 pm" ${horarioActual === "3:30 - 4:00 pm" ? "selected" : ""}>3:30 - 4:00 pm</option>
                <option value="4:00 - 4:30 pm" ${horarioActual === "4:00 - 4:30 pm" ? "selected" : ""}>4:00 - 4:30 pm</option>
                <option value="4:30 - 5:00 pm" ${horarioActual === "4:30 - 5:00 pm" ? "selected" : ""}>4:30 - 5:00 pm</option>
                <option value="5:00 - 5:30 pm" ${horarioActual === "5:00 - 5:30 pm" ? "selected" : ""}>5:00 - 5:30 pm</option>
                <option value="5:30 - 6:00 pm" ${horarioActual === "5:30 - 6:00 pm" ? "selected" : ""}>5:30 - 6:00 pm</option>
              </select>
            </div>
            <div class="modal-editar-cita-actions">
              <button type="button" class="btn-edit-cita-cancel" id="btnCancelEditCita">
                <i class="fa-solid fa-xmark"></i> Cancelar
              </button>
              <button type="submit" class="btn-edit-cita-save" id="btnSaveEditCita">
                <i class="fa-solid fa-check"></i> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      `;

      // Mostrar el modal
      modal.classList.remove("hidden");

      // Event listeners
      const form = document.getElementById("formEditarCita");
      const btnCancel = document.getElementById("btnCancelEditCita");
      const btnSave = document.getElementById("btnSaveEditCita");
      const errorDiv = document.getElementById("errorEditCita");

      const cerrarModal = () => {
        modal.classList.add("hidden");
      };

      btnCancel.addEventListener("click", cerrarModal);

      // Cerrar al hacer clic fuera del modal
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          cerrarModal();
        }
      });

      // Cerrar con ESC
      const handleEsc = (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          cerrarModal();
          document.removeEventListener("keydown", handleEsc);
        }
      };
      document.addEventListener("keydown", handleEsc);

      // Función para mostrar notificación de horario ocupado
      const mostrarNotificacionHorarioOcupado = function(mensaje, conflicto) {
        // Eliminar notificación anterior si existe
        const notifAnterior = document.getElementById("notification-horario-ocupado-edit");
        if (notifAnterior) notifAnterior.remove();

        // Crear notificación
        const notification = document.createElement("div");
        notification.id = "notification-horario-ocupado-edit";
        document.body.appendChild(notification);

        // Agregar estilos si no existen
        if (!document.getElementById("notification-horario-ocupado-edit-styles")) {
          const style = document.createElement("style");
          style.id = "notification-horario-ocupado-edit-styles";
          style.textContent = `
            #notification-horario-ocupado-edit {
              position: fixed;
              top: 20px;
              right: 20px;
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 1.25rem 1.5rem;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
              z-index: 10001;
              max-width: 420px;
              animation: slideInRightNotificationEdit 0.4s ease;
              display: flex;
              align-items: flex-start;
              gap: 1rem;
            }

            @keyframes slideInRightNotificationEdit {
              from {
                transform: translateX(120%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }

            @keyframes slideOutRightNotificationEdit {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(120%);
                opacity: 0;
              }
            }

            #notification-horario-ocupado-edit .notification-icon {
              width: 40px;
              height: 40px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }

            #notification-horario-ocupado-edit .notification-icon i {
              font-size: 1.25rem;
              color: white;
            }

            #notification-horario-ocupado-edit .notification-content {
              flex: 1;
            }

            #notification-horario-ocupado-edit .notification-title {
              font-size: 1.1rem;
              font-weight: 700;
              margin: 0 0 0.5rem 0;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }

            #notification-horario-ocupado-edit .notification-message {
              font-size: 0.95rem;
              line-height: 1.5;
              margin: 0;
              opacity: 0.95;
            }

            #notification-horario-ocupado-edit .notification-close {
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              transition: background 0.2s;
            }

            #notification-horario-ocupado-edit .notification-close:hover {
              background: rgba(255, 255, 255, 0.3);
            }

            @media (max-width: 480px) {
              #notification-horario-ocupado-edit {
                right: 10px;
                left: 10px;
                max-width: none;
              }
            }
          `;
          document.head.appendChild(style);
        }

        notification.innerHTML = `
          <div class="notification-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">
              <i class="fa-solid fa-exclamation-triangle"></i>
              Horario Ocupado
            </div>
            <div class="notification-message">${mensaje}</div>
          </div>
          <button class="notification-close" onclick="this.closest('#notification-horario-ocupado-edit').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        `;

        // Auto-ocultar después de 6 segundos
        setTimeout(() => {
          notification.style.animation = "slideOutRightNotificationEdit 0.4s ease";
          setTimeout(() => notification.remove(), 400);
        }, 6000);
      };

      // Manejar envío del formulario
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nuevaFecha = document.getElementById("fechaCitaEdit").value;
        const nuevoHorario = document.getElementById("horarioCitaEdit").value;

        if (!nuevaFecha || !nuevoHorario) {
          errorDiv.textContent = "Por favor complete todos los campos";
          errorDiv.classList.add("show");
          return;
        }

        // Validar que la fecha no sea en el pasado
        const fechaSeleccionada = new Date(nuevaFecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaSeleccionada < hoy) {
          errorDiv.textContent = "La fecha no puede ser anterior a hoy";
          errorDiv.classList.add("show");
          return;
        }

        // Deshabilitar botón mientras se procesa
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        errorDiv.classList.remove("show");

        try {
          const res = await fetch(`/api/citas/${citaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaCita: nuevaFecha, horario: nuevoHorario })
      });
          
          const data = await res.json();
          
          // Manejar error de conflicto (409)
          if (res.status === 409) {
            // Verificar si es el error específico de cita de misma especialidad en la misma fecha
            if (data.tipoError === "cita_misma_especialidad_fecha") {
              cerrarModal();
              mostrarModalAlerta(
                "Cita duplicada",
                "Ya tienes una cita de esta especialidad para esta fecha",
                "error"
              );
              btnSave.disabled = false;
              btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Guardar Cambios';
              return;
            }
            // Si es otro tipo de conflicto (horario ocupado), mostrar notificación
            mostrarNotificacionHorarioOcupado(data.message || "El horario seleccionado ya está ocupado.", data.conflicto);
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Guardar Cambios';
            return;
          }
          
          // Verificar si hay error de límite de intentos (403)
          if (res.status === 403 && data.limiteAlcanzado) {
            cerrarModal();
            mostrarModalAlerta(
              "Límite de intentos alcanzado",
              "Ya no tienes más intento de cambios en tu cita",
              "error"
            );
            await recargarCitasConPagos();
            return;
          }
          
          if (!res.ok) {
            throw new Error(data.message || data.error || 'No se pudo editar la cita');
          }

          // Obtener información de intentos de la respuesta
          const intentosEdicion = data.intentosEdicion || 0;
          const intentosRestantes = data.intentosRestantes || 0;

          // Mostrar mensaje de éxito
          btnSave.innerHTML = '<i class="fa-solid fa-check"></i> ¡Guardado!';
          btnSave.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          
          setTimeout(async () => {
            cerrarModal();
            
            // Mostrar modal según el número de intentos
            if (intentosEdicion === 1) {
              // Primer intento: mostrar advertencia
              mostrarModalAlerta(
                "Advertencia",
                "Tienes 1 intento más para editar tu cita, asegúrate de estar conforme",
                "warning"
              );
            } else if (intentosEdicion >= 2) {
              // Segundo intento: mostrar que ya no hay más intentos
              mostrarModalAlerta(
                "Límite de intentos alcanzado",
                "Ya no tienes más intento de cambios en tu cita",
                "error"
              );
            }

            await recargarCitasConPagos();
          }, 800);

        } catch (error) {
          errorDiv.textContent = error.message || 'Error al actualizar la cita';
          errorDiv.classList.add("show");
          btnSave.disabled = false;
          btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Guardar Cambios';
        }
      });

    } catch (error) {
      alert('Error al cargar la información de la cita: ' + error.message);
    }
  };

  window.editarCitaPrompt = async (id) => {
    await mostrarModalEditarCita(id);
  };

  window.pagarCita = async (id) => {
    console.log('Botón Pagar presionado para cita:', id);
    
    // Verificar si la cita ya tiene pago antes de proceder
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      try {
        const resPagos = await fetch(`http://localhost:5000/api/pagos?email=${encodeURIComponent(email)}`);
        if (resPagos.ok) {
          const pagos = await resPagos.json();
          const tienePago = pagos.some(pago => {
            const citaId = typeof pago.citaId === 'object' && pago.citaId !== null && pago.citaId._id
              ? pago.citaId._id.toString()
              : (pago.citaId ? pago.citaId.toString() : null);
            return citaId === id.toString();
          });
          
          if (tienePago) {
            alert('Esta cita ya tiene un pago registrado. Puedes ver el pago en la sección "Pagos".');
            loadSection('pagos');
            return;
          }
        }
      } catch (error) {
        console.warn('Error al verificar pago:', error);
        // Continuar con el proceso si hay error en la verificación
      }
    }
    
    // Guardar el ID de la cita y redirigir directamente a la vista de pago
    sessionStorage.setItem('ultimaCitaId', id);
    sessionStorage.removeItem('citaIdPagar'); // Limpiar por si acaso
    loadSection('pagar-cita');
  };

  // ============================================================
  // ✅ FUNCIONES DE RECOMENDACIONES
  // ============================================================
  const getRecomendaciones = (especialidad, motivoCita) => {
    const recomendaciones = {
      "Análisis": {
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
      },
      "Cardiología": {
        titulo: "Recomendaciones para Consulta de Cardiología",
        items: [
          "Evitar comer 8-12 horas antes si te pedirán perfil lipídico o glucosa.",
          "No hacer ejercicio fuerte 24 horas antes, porque altera resultados.",
          "Lleve un registro de su presión arterial si la monitorea en casa.",
          "Traiga los resultados de exámenes cardíacos previos si los tiene.",
          "Use ropa cómoda que permita acceso al pecho y brazos.",
          "Prepare una lista de los medicamentos que está tomando.",
          "Anote los síntomas que ha experimentado (dolor de pecho, palpitaciones, etc.)."
        ]
      },
      "Dermatología": {
        titulo: "Recomendaciones para Consulta de Dermatología",
        items: [
          "No aplicar cremas, maquillaje, lociones o pomadas en el área a evaluar antes del examen o raspado.",
          "Evita rascar o manipular la lesión.",
          "Lleve fotografías si la condición ha cambiado desde que programó la cita.",
          "Traiga una lista de productos de cuidado de la piel que está usando.",
          "Use ropa que permita fácil acceso a las áreas afectadas.",
          "Anote cuándo comenzaron los síntomas y cómo han evolucionado.",
          "Informe sobre alergias conocidas a medicamentos o productos."
        ]
      },
      "Pediatría": {
        titulo: "Recomendaciones para Consulta de Pediatría",
        items: [
          "Mantener al niño bien hidratado y descansado.",
          "No darle antibióticos sin receta antes de exámenes (pueden alterar infecciones en orina/heces).",
          "Traer vaso de orina.",
          "Lleve el carnet de vacunación del niño/a.",
          "Traiga un registro de peso y talla si lo tiene.",
          "Prepare una lista de medicamentos que el niño/a está tomando.",
          "Anote los síntomas, cuándo comenzaron y su evolución.",
          "Lleve juguetes o libros para mantener al niño/a tranquilo/a."
        ]
      },
      "Traumatología": {
        titulo: "Recomendaciones para Consulta de Traumatología",
        items: [
          "Si es análisis preoperatorio: estar en ayunas y no tomar alcohol 48 horas antes.",
          "Evitar antiinflamatorios sin indicación.",
          "Traer vaso de orina.",
          "Lleve radiografías o estudios previos relacionados con la lesión.",
          "Use ropa cómoda que permita examinar el área afectada.",
          "Anote cuándo ocurrió la lesión y cómo sucedió.",
          "Describa el tipo de dolor (agudo, crónico, punzante, etc.).",
          "Traiga una lista de medicamentos que está tomando."
        ]
      },
      "Neurología": {
        titulo: "Recomendaciones para Consulta de Neurología",
        items: [
          "Traer vaso de orina.",
          "Dormir lo suficiente. La falta de sueño altera glucosa, hormonas y estudios como el EEG.",
          "Evitar cafeína y alcohol 24 horas antes si se harán análisis de sangre.",
          "Lleve estudios previos (resonancia, tomografía, EEG) si los tiene.",
          "Anote los síntomas neurológicos que ha experimentado.",
          "Prepare un registro de episodios (convulsiones, mareos, etc.) con fechas.",
          "Traiga una lista completa de medicamentos actuales.",
          "Lleve un acompañante si tiene problemas de memoria o equilibrio."
        ]
      },
      "Hematología": {
        titulo: "Recomendaciones para Consulta de Hematología",
        items: [
          "No consumir alcohol 48 horas antes.",
          "Evitar ejercicio intenso 24 h antes (alteran hemoglobina y plaquetas).",
          "Si es ayunas, solo agua.",
          "Lleve resultados de análisis de sangre previos si los tiene.",
          "Informe sobre sangrados anormales o moretones frecuentes.",
          "Anote síntomas como fatiga, debilidad o palidez.",
          "Traiga una lista de medicamentos que está tomando.",
          "Informe sobre antecedentes familiares de enfermedades de la sangre."
        ]
      },
      "Inmunología": {
        titulo: "Recomendaciones para Consulta de Inmunología",
        items: [
          "No tomar antihistamínicos 5-7 días antes si te harán pruebas de alergia.",
          "No vacunarte 1-2 semanas antes de un perfil inmunológico (puede alterar anticuerpos).",
          "Traer vaso de orina.",
          "Lleve un registro de alergias conocidas y reacciones alérgicas previas.",
          "Anote los síntomas alérgicos que ha experimentado.",
          "Traiga una lista de medicamentos y suplementos que está tomando.",
          "Informe sobre condiciones autoinmunes en la familia.",
          "Lleve resultados de pruebas de alergia previas si las tiene."
        ]
      },
      "Bioquímica": {
        titulo: "Recomendaciones para Consulta de Bioquímica",
        items: [
          "Estar en ayunas 8-12 horas para exámenes de glucosa, triglicéridos, colesterol.",
          "No fumar ni tomar café esa mañana.",
          "Traer vaso de orina.",
          "Lleve resultados de análisis bioquímicos previos si los tiene.",
          "Informe sobre su dieta y hábitos alimenticios.",
          "Anote síntomas relacionados con el metabolismo (fatiga, cambios de peso, etc.).",
          "Traiga una lista de medicamentos y suplementos que está tomando."
        ]
      }
    };

    // Si es análisis, devolver recomendaciones según la especialidad
    if (motivoCita === "Análisis" || motivoCita === "Para sacar análisis") {
      // Actualizar recomendaciones para análisis por especialidad
      const recomendacionesAnalisis = {
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
      
      return recomendacionesAnalisis[especialidad] || recomendaciones["Análisis"];
    }

    // Si no es análisis, devolver recomendaciones según la especialidad
    return recomendaciones[especialidad] || {
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

  window.showModalRecomendaciones = (especialidad, motivoCita) => {
    const recomendaciones = getRecomendaciones(especialidad, motivoCita);
    
    // Crear o obtener el modal de recomendaciones
    let modalRecomendaciones = document.getElementById("modalRecomendaciones");
    
    if (!modalRecomendaciones) {
      // Crear el modal si no existe
      modalRecomendaciones = document.createElement("div");
      modalRecomendaciones.id = "modalRecomendaciones";
      modalRecomendaciones.className = "modal-overlay";
      modalRecomendaciones.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 10000;";
      modalRecomendaciones.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto; background: white; border-radius: 12px; padding: 2rem; position: relative;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="width: 60px; height: 60px; margin: 0 auto 1rem; background: #1976d2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <i class="fa-solid fa-lightbulb" style="color: white; font-size: 1.5rem;"></i>
            </div>
            <h2 id="modalRecomendacionesTitulo" style="margin: 0; color: #1976d2; font-size: 1.5rem;"></h2>
          </div>
          <div id="modalRecomendacionesLista" style="margin-bottom: 1.5rem;"></div>
          <button class="btn-primary" id="btnCerrarRecomendaciones" style="width: 100%;">
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

    // Configurar el botón "Entendido" para cerrar el modal
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

  // ============================================================
  // ✅ GUARDAR CITA CON MODAL
  // ============================================================
  const handleSolicitarCita = async () => {
    const email = sessionStorage.getItem("userEmail");
    const especialidad = document.getElementById("especialidad")?.value;
    const fechaCita = document.getElementById("fechaCita")?.value;
    const horario = document.getElementById("horario")?.value;
    let motivoCita = document.getElementById("motivoCita")?.value;
    
    // Verificar si hay un doctor seleccionado desde el apartado de doctores
    const doctorSeleccionadoId = sessionStorage.getItem("doctorSeleccionadoId");
    
    // Si hay un doctor seleccionado, forzar el motivoCita a "Consulta Médica"
    if (doctorSeleccionadoId) {
      motivoCita = "Consulta Médica";
      console.log("🔒 Motivo de cita forzado a 'Consulta Médica' porque hay un doctor seleccionado");
    }

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
      if (!res.ok) {
        // Si hay un error de cita de la misma especialidad en la misma fecha
        if (res.status === 409 && data.tipoError === "cita_misma_especialidad_fecha") {
          throw new Error("Ya tienes una cita registrada para esta fecha");
        }
        // Si hay un conflicto de horario (status 409), mostrar mensaje personalizado
        if (res.status === 409 || data.conflicto) {
          throw new Error("Ya hay una cita reservada en este horario, por favor escoja una nuevo");
        }
        throw new Error(data.error || data.message || "Error al guardar la cita");
      }

      console.log("Cita registrada correctamente:", data);

      // Limpiar datos del doctor seleccionado después de registrar la cita
      sessionStorage.removeItem("doctorSeleccionadoId");
      sessionStorage.removeItem("especialidadSeleccionada");

      showModal(true, "Cita registrada", "Tu cita ha sido registrada correctamente.");
      
      // Guardar especialidad y motivo para mostrar recomendaciones después
      sessionStorage.setItem('ultimaEspecialidadCita', especialidad);
      sessionStorage.setItem('ultimoMotivoCita', motivoCita);
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
      if (success) {
        // Limpiar datos temporales
        sessionStorage.removeItem('ultimaEspecialidadCita');
        sessionStorage.removeItem('ultimoMotivoCita');
        // Redirigir a la lista de citas
        loadSection("citas");
      }
    };
  };

  // ============================================================
  // 🔹 SOLICITAR CITA VIEW
  // ============================================================
  const initSolicitarCitaView = async () => {
    // Pequeño delay para asegurar que el DOM esté completamente cargado
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const btnVolverCitas = document.getElementById("btnVolverCitas");
    const formSolicitarCita = document.getElementById("formSolicitarCita");
    const fechaCita = document.getElementById("fechaCita");
    const especialidadSelect = document.getElementById("especialidad");
    const precioEspecialidadDiv = document.getElementById("precioEspecialidad");
    const montoEspecialidadSpan = document.getElementById("montoEspecialidad");
    const especialidadGroup = especialidadSelect?.closest(".form-group");
    const motivoCitaSelect = document.getElementById("motivoCita");

    if (fechaCita) {
      const today = new Date().toISOString().split("T")[0];
      fechaCita.setAttribute("min", today);
    }

    if (btnVolverCitas) {
      // Remover listeners anteriores si existen
      const newBtn = btnVolverCitas.cloneNode(true);
      btnVolverCitas.parentNode.replaceChild(newBtn, btnVolverCitas);
      newBtn.addEventListener("click", () => {
        // Limpiar datos del doctor seleccionado al volver
        sessionStorage.removeItem("doctorSeleccionadoId");
        sessionStorage.removeItem("especialidadSeleccionada");
        loadSection("citas");
      });
    }

    // Verificar si hay un doctor seleccionado desde el apartado de doctores
    const doctorSeleccionadoId = sessionStorage.getItem("doctorSeleccionadoId");
    const especialidadSeleccionada = sessionStorage.getItem("especialidadSeleccionada");
    
    console.log("🔍 Verificando doctor seleccionado:", { doctorSeleccionadoId, especialidadSeleccionada, especialidadSelect: !!especialidadSelect });
    
    // Si el elemento no está disponible, intentar de nuevo después de un breve delay
    if (!especialidadSelect && doctorSeleccionadoId) {
      console.warn("⚠️ Selector de especialidad no encontrado, reintentando...");
      setTimeout(() => initSolicitarCitaView(), 100);
      return;
    }
    
    if (doctorSeleccionadoId && especialidadSeleccionada && especialidadSelect) {
      try {
        console.log("📋 Obteniendo información del doctor:", doctorSeleccionadoId);
        // Obtener información del doctor
        const response = await fetch(`/api/personal/${doctorSeleccionadoId}`);
        if (response.ok) {
          const doctor = await response.json();
          console.log("✅ Doctor obtenido:", doctor);
          
          // Limpiar todas las opciones del select
          especialidadSelect.innerHTML = "";
          
          // Agregar solo la opción de la especialidad del doctor
          const opcionEspecialidad = document.createElement("option");
          opcionEspecialidad.value = doctor.especialidad || especialidadSeleccionada;
          opcionEspecialidad.textContent = doctor.especialidad || especialidadSeleccionada;
          opcionEspecialidad.selected = true;
          especialidadSelect.appendChild(opcionEspecialidad);
          
          // Deshabilitar el selector de especialidad para que no se pueda cambiar
          especialidadSelect.disabled = true;
          especialidadSelect.style.backgroundColor = "#f3f4f6";
          especialidadSelect.style.cursor = "not-allowed";
          especialidadSelect.setAttribute("readonly", "readonly");
          
          console.log("🔒 Selector deshabilitado. Solo muestra:", doctor.especialidad || especialidadSeleccionada);
          
          // Agregar un mensaje informativo si no existe
          let mensajeDoctor = especialidadGroup?.querySelector(".doctor-info-message");
          if (!mensajeDoctor && especialidadGroup) {
            const nombreCompleto = `${doctor.nombres || ""} ${doctor.apellidos || ""}`.trim() || "el doctor seleccionado";
            const genero = doctor.genero || "masculino";
            const titulo = genero === "femenino" ? "Dra." : "Dr.";
            
            mensajeDoctor = document.createElement("div");
            mensajeDoctor.className = "doctor-info-message";
            mensajeDoctor.style.cssText = "margin-top: 0.5rem; padding: 0.75rem; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 6px; font-size: 0.9rem; color: #0c4a6e;";
            mensajeDoctor.innerHTML = `<i class="fa-solid fa-user-doctor" style="margin-right: 0.5rem;"></i>Reservando cita con <strong>${titulo} ${nombreCompleto}</strong> - Especialidad: <strong>${doctor.especialidad || especialidadSeleccionada}</strong>`;
            especialidadGroup.appendChild(mensajeDoctor);
          }
          
          // Mostrar el precio si existe la función
          if (precioEspecialidadDiv && montoEspecialidadSpan && window.getPrecioEspecialidad) {
            const precio = window.getPrecioEspecialidad(doctor.especialidad || especialidadSeleccionada);
            montoEspecialidadSpan.textContent = `S/ ${precio.toFixed(2)}`;
            precioEspecialidadDiv.style.display = "block";
          }
          
          // Fijar el motivo de la cita a "Consulta Médica" y deshabilitar el campo completo
          if (motivoCitaSelect) {
            // Deshabilitar la opción "Análisis"
            const opcionAnalisis = Array.from(motivoCitaSelect.options).find(
              option => option.value === "Análisis"
            );
            if (opcionAnalisis) {
              opcionAnalisis.disabled = true;
              opcionAnalisis.style.color = "#9ca3af";
              console.log("🔒 Opción 'Análisis' deshabilitada porque se reserva desde el apartado de doctores");
            }
            
            // Fijar el valor a "Consulta Médica"
            motivoCitaSelect.value = "Consulta Médica";
            
            // Deshabilitar el campo completo para que no se pueda elegir
            motivoCitaSelect.disabled = true;
            motivoCitaSelect.style.backgroundColor = "#f3f4f6";
            motivoCitaSelect.style.cursor = "not-allowed";
            motivoCitaSelect.setAttribute("readonly", "readonly");
            
            console.log("🔒 Campo motivoCita deshabilitado. Solo muestra 'Consulta Médica'");
            
            // Agregar un mensaje informativo si no existe
            let mensajeMotivo = motivoCitaGroup?.querySelector(".motivo-info-message");
            if (!mensajeMotivo && motivoCitaGroup) {
              mensajeMotivo = document.createElement("div");
              mensajeMotivo.className = "motivo-info-message";
              mensajeMotivo.style.cssText = "margin-top: 0.5rem; padding: 0.75rem; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; font-size: 0.9rem; color: #92400e;";
              mensajeMotivo.innerHTML = `<i class="fa-solid fa-info-circle" style="margin-right: 0.5rem;"></i>El motivo de la cita está fijado en <strong>Consulta Médica</strong> y la opción <strong>Análisis</strong> está desactivada porque estás reservando desde el apartado de doctores.`;
              motivoCitaGroup.appendChild(mensajeMotivo);
            }
          }
        } else {
          console.error("❌ Error en la respuesta del servidor:", response.status);
        }
      } catch (error) {
        console.error("❌ Error al obtener información del doctor:", error);
        // Si hay error, permitir seleccionar normalmente
        if (especialidadSelect) {
          especialidadSelect.value = especialidadSeleccionada || "";
        }
      }
    } else if (especialidadSeleccionada && especialidadSelect && !doctorSeleccionadoId) {
      // Si solo hay especialidad pero no doctor, pre-seleccionar normalmente
      especialidadSelect.value = especialidadSeleccionada;
      sessionStorage.removeItem("especialidadSeleccionada");
      
      // Mostrar el precio si existe la función
      if (precioEspecialidadDiv && montoEspecialidadSpan && window.getPrecioEspecialidad) {
        const precio = window.getPrecioEspecialidad(especialidadSeleccionada);
        montoEspecialidadSpan.textContent = `S/ ${precio.toFixed(2)}`;
        precioEspecialidadDiv.style.display = "block";
      }
    }
    
    // Si NO hay doctor seleccionado, asegurarse de que todas las opciones de motivoCita estén habilitadas
    if (!doctorSeleccionadoId && motivoCitaSelect) {
      Array.from(motivoCitaSelect.options).forEach(option => {
        if (option.value === "Análisis") {
          option.disabled = false;
          option.style.color = "";
        }
      });
    }

    // Mostrar precio cuando se selecciona una especialidad (solo si no está deshabilitado)
    if (especialidadSelect && precioEspecialidadDiv && montoEspecialidadSpan && !especialidadSelect.disabled) {
      especialidadSelect.addEventListener("change", (e) => {
        const especialidad = e.target.value;
        if (especialidad) {
          if (window.getPrecioEspecialidad) {
            const precio = window.getPrecioEspecialidad(especialidad);
            montoEspecialidadSpan.textContent = `S/ ${precio.toFixed(2)}`;
            precioEspecialidadDiv.style.display = "block";
          }
        } else {
          precioEspecialidadDiv.style.display = "none";
        }
      });
    }

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
    // Cargar último análisis registrado
    await cargarUltimoAnalisis();
  };

  const cargarUltimoAnalisis = async () => {
    try {
      const email = sessionStorage.getItem("userEmail");
      if (!email) return;

      const resultados = await getResultados();
      
      if (!resultados || resultados.length === 0) {
        // Si no hay resultados, mostrar mensaje
        const resumenCard = document.querySelector('.card.resumen');
        if (resumenCard) {
          const resumenDatos = resumenCard.querySelector('.resumen-datos');
          if (resumenDatos) {
            resumenDatos.innerHTML = '<p style="color: #666;">No hay análisis registrados</p>';
          }
        }
        return;
      }

      // Ordenar por fecha más reciente
      const resultadosOrdenados = resultados.sort((a, b) => {
        const fechaA = new Date(a.fechaResultado || a.fechaExamen);
        const fechaB = new Date(b.fechaResultado || b.fechaExamen);
        return fechaB - fechaA;
      });

      const ultimoResultado = resultadosOrdenados[0];
      
      // Formatear fecha
      const fecha = new Date(ultimoResultado.fechaResultado || ultimoResultado.fechaExamen);
      const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Actualizar el HTML del resumen (sin estado)
      const resumenCard = document.querySelector('.card.resumen');
      if (resumenCard) {
        const resumenDatos = resumenCard.querySelector('.resumen-datos');
        if (resumenDatos) {
          resumenDatos.innerHTML = `
            <p><strong>Examen:</strong> ${ultimoResultado.tipoExamen || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${fechaFormateada}</p>
          `;
        }
      }
    } catch (err) {
      console.error("Error cargando último análisis:", err);
      const resumenCard = document.querySelector('.card.resumen');
      if (resumenCard) {
        const resumenDatos = resumenCard.querySelector('.resumen-datos');
        if (resumenDatos) {
          resumenDatos.innerHTML = '<p style="color: #666;">Error al cargar el último análisis</p>';
        }
      }
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

  // Función global para volver a resultados
  window.volverAResultados = () => {
    loadSection("resultados");
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
  
  // Cargar avatar del usuario al iniciar la aplicación
  const cargarAvatarUsuario = async () => {
    const email = sessionStorage.getItem("userEmail");
    if (!email) return;

    try {
      const res = await fetch(`http://localhost:5000/api/perfil?email=${email}`);
      if (!res.ok) return;
      const data = await res.json();

      const defaultAvatar = "assets2/img/avatar-sofia.jpg";
      const avatarUrl = data.imagen 
        ? `http://localhost:5000${data.imagen}` 
        : defaultAvatar;

      const topbarAvatar = document.getElementById("topbar-avatar");
      if (topbarAvatar) {
        topbarAvatar.src = avatarUrl;
        topbarAvatar.onerror = () => {
          topbarAvatar.src = defaultAvatar;
        };
      }
    } catch (err) {
      console.error("Error cargando avatar:", err);
    }
  };

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

      // Cargar y mostrar información médica básica
      const infoMedica = data.informacionMedica || {};
      const alergias = infoMedica.alergias || [];
      const medicamentos = infoMedica.medicamentosActuales || [];
      const condiciones = infoMedica.condicionesMedicas || [];
      const grupoSanguineo = infoMedica.grupoSanguineo || '';
      const contactoEmergencia = infoMedica.contactoEmergencia || {};
      const notasMedicas = infoMedica.notasMedicas || '';

      // Mostrar alergias
      const profileAlergias = document.getElementById("profile-alergias");
      if (profileAlergias) {
        if (alergias.length > 0) {
          profileAlergias.innerHTML = `<ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">${alergias.map(a => `<li style="margin: 0.25rem 0;">${a}</li>`).join('')}</ul>`;
        } else {
          profileAlergias.innerHTML = '<span style="color: #9ca3af;">No se han registrado alergias</span>';
        }
      }

      // Mostrar medicamentos
      const profileMedicamentos = document.getElementById("profile-medicamentos");
      if (profileMedicamentos) {
        if (medicamentos.length > 0) {
          profileMedicamentos.innerHTML = `<ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">${medicamentos.map(m => `<li style="margin: 0.25rem 0;">${m}</li>`).join('')}</ul>`;
        } else {
          profileMedicamentos.innerHTML = '<span style="color: #9ca3af;">No se han registrado medicamentos actuales</span>';
        }
      }

      // Mostrar condiciones médicas
      const profileCondiciones = document.getElementById("profile-condiciones");
      if (profileCondiciones) {
        if (condiciones.length > 0) {
          profileCondiciones.innerHTML = `<ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">${condiciones.map(c => `<li style="margin: 0.25rem 0;">${c}</li>`).join('')}</ul>`;
        } else {
          profileCondiciones.innerHTML = '<span style="color: #9ca3af;">No se han registrado condiciones médicas</span>';
        }
      }

      // Mostrar grupo sanguíneo
      const profileGrupoSanguineo = document.getElementById("profile-grupo-sanguineo");
      if (profileGrupoSanguineo) {
        profileGrupoSanguineo.textContent = grupoSanguineo || 'No especificado';
      }

      // Mostrar contacto de emergencia
      const profileContactoEmergencia = document.getElementById("profile-contacto-emergencia");
      if (profileContactoEmergencia && contactoEmergencia.nombre) {
        profileContactoEmergencia.style.display = 'block';
        document.getElementById("profile-contacto-nombre").textContent = contactoEmergencia.nombre || '-';
        document.getElementById("profile-contacto-relacion").textContent = contactoEmergencia.relacion || '-';
        document.getElementById("profile-contacto-telefono").textContent = contactoEmergencia.telefono || '-';
      } else if (profileContactoEmergencia) {
        profileContactoEmergencia.style.display = 'none';
      }

      // Mostrar notas médicas
      const profileNotasMedicas = document.getElementById("profile-notas-medicas");
      const profileNotasTexto = document.getElementById("profile-notas-texto");
      if (profileNotasMedicas && profileNotasTexto) {
        if (notasMedicas) {
          profileNotasMedicas.style.display = 'block';
          profileNotasTexto.textContent = notasMedicas;
        } else {
          profileNotasMedicas.style.display = 'none';
        }
      }

      // Actualizar imagen de perfil en la vista de perfil
      const profileAvatar = document.getElementById("profile-avatar");
      const defaultAvatar = "assets2/img/avatar-sofia.jpg";
      const avatarUrl = data.imagen 
        ? `http://localhost:5000${data.imagen}` 
        : defaultAvatar;

      if (profileAvatar) {
        profileAvatar.src = avatarUrl;
        profileAvatar.onerror = () => {
          profileAvatar.src = defaultAvatar;
        };
      }

      // Actualizar avatar en el topbar
      const topbarAvatar = document.getElementById("topbar-avatar");
      if (topbarAvatar) {
        topbarAvatar.src = avatarUrl;
        topbarAvatar.onerror = () => {
          topbarAvatar.src = defaultAvatar;
        };
      }

      // Llenar formulario de edición
      document.getElementById("edit-nombres").value = data.nombres || "";
      document.getElementById("edit-apellidos").value = data.apellidos || "";
      document.getElementById("edit-edad").value = data.edad || "";
      document.getElementById("edit-genero").value = data.genero || "";
      document.getElementById("edit-direccion").value = data.direccion || "";
      document.getElementById("edit-celular").value = data.celular || "";
      
      // Limpiar input de imagen y preview
      const editImagen = document.getElementById("edit-imagen");
      const previewImagen = document.getElementById("preview-imagen");
      if (editImagen) editImagen.value = "";
      if (previewImagen) {
        previewImagen.style.display = "none";
        previewImagen.src = "";
      }
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
    const btnChangeAvatar = document.getElementById("btn-change-avatar");
    const inputImagen = document.getElementById("input-imagen");
    const editImagen = document.getElementById("edit-imagen");
    const previewImagen = document.getElementById("preview-imagen");

    // Botón para cambiar avatar desde la cabecera
    if (btnChangeAvatar && inputImagen) {
      btnChangeAvatar.addEventListener("click", () => {
        inputImagen.click();
      });

      inputImagen.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validar tipo de archivo
          const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            alert("Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)");
            inputImagen.value = "";
            return;
          }

          // Validar tamaño (5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert("El archivo es demasiado grande. El tamaño máximo es 5MB");
            inputImagen.value = "";
            return;
          }

          // Abrir el formulario de edición si no está abierto
          if (profileView.style.display !== "none") {
            profileView.style.display = "none";
            formEdit.style.display = "block";
            if (btnEdit) btnEdit.style.display = "none";
          }

          // Asignar el archivo al input del formulario usando DataTransfer
          if (editImagen) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            editImagen.files = dataTransfer.files;
            
            // Disparar evento change para que se muestre el preview
            editImagen.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      });
    }

    // Preview de imagen en el formulario de edición
    if (editImagen && previewImagen) {
      editImagen.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validar tipo de archivo
          const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            alert("Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)");
            editImagen.value = "";
            previewImagen.style.display = "none";
            return;
          }

          // Validar tamaño (5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert("El archivo es demasiado grande. El tamaño máximo es 5MB");
            editImagen.value = "";
            previewImagen.style.display = "none";
            return;
          }

          // Mostrar preview
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImagen.src = e.target.result;
            previewImagen.style.display = "block";
          };
          reader.readAsDataURL(file);
        } else {
          previewImagen.style.display = "none";
        }
      });
    }

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

        // Crear FormData para enviar datos y archivo
        const formData = new FormData();
        formData.append("nombres", document.getElementById("edit-nombres").value);
        formData.append("apellidos", document.getElementById("edit-apellidos").value);
        formData.append("edad", Number(document.getElementById("edit-edad").value));
        formData.append("genero", document.getElementById("edit-genero").value);
        formData.append("direccion", document.getElementById("edit-direccion").value);
        formData.append("celular", document.getElementById("edit-celular").value);

        // Agregar imagen si se seleccionó una
        const imagenFile = editImagen?.files[0];
        if (imagenFile) {
          formData.append("imagen", imagenFile);
        }

        try {
          const res = await fetch(`http://localhost:5000/api/perfil?email=${email}`, {
            method: "PUT",
            body: formData, // No establecer Content-Type, el navegador lo hará automáticamente con el boundary
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Error al actualizar el perfil");
          }

          const result = await res.json();
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
  const initPagarCitaView = () => {
    console.log("Vista de pago de cita inicializada");
    
    // Obtener citaId de sessionStorage
    const citaId = sessionStorage.getItem('ultimaCitaId') || sessionStorage.getItem('citaIdPagar');
    const email = sessionStorage.getItem('userEmail');
    
    if (!citaId) {
      console.error('No se encontró citaId en sessionStorage');
      alert('No se encontró información de la cita. Redirigiendo...');
      loadSection('citas');
      return;
    }
    
    // Limpiar citaIdPagar si existe
    if (sessionStorage.getItem('citaIdPagar')) {
      sessionStorage.removeItem('citaIdPagar');
    }
    
    // Esperar a que el DOM esté listo y luego inicializar
    setTimeout(() => {
      inicializarFormularioPago(citaId, email);
    }, 100);
  };
  
  const inicializarFormularioPago = async (citaId, email) => {
    console.log('Inicializando formulario de pago:', { citaId, email });
    
    try {
      // Obtener información de la cita
      const res = await fetch(`http://localhost:5000/api/citas?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Error al cargar cita');
      const citas = await res.json();
      const cita = Array.isArray(citas) ? citas.find(c => c._id === citaId) : null;
      
      if (!cita) {
        alert('No se encontró la cita. Redirigiendo...');
        loadSection('citas');
        return;
      }
      
      // Función para obtener precio
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
      
      // Llenar campos del formulario
      const citaIdInput = document.getElementById('citaId');
      const emailInput = document.getElementById('emailPaciente');
      const montoInput = document.getElementById('montoPago');
      
      if (citaIdInput) citaIdInput.value = citaId;
      if (emailInput) emailInput.value = email;
      
      // Llenar información de la cita
      const especialidadEl = document.getElementById('especialidadCita');
      const fechaEl = document.getElementById('fechaCita');
      const horarioEl = document.getElementById('horarioCita');
      const montoCitaEl = document.getElementById('montoCita');
      
      if (especialidadEl) especialidadEl.textContent = cita.especialidad || '-';
      
      if (fechaEl && cita.fechaCita) {
        const fecha = new Date(cita.fechaCita);
        fechaEl.textContent = fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      if (horarioEl) horarioEl.textContent = cita.horario || '-';
      
      const precio = getPrecioEspecialidad(cita.especialidad);
      if (montoInput) montoInput.value = precio.toFixed(2);
      if (montoCitaEl) montoCitaEl.textContent = `S/ ${precio.toFixed(2)}`;
      
      // Cargar información del paciente
      let nombreCompleto = 'Usuario';
      try {
        const resPerfil = await fetch(`http://localhost:5000/api/perfil?email=${encodeURIComponent(email)}`);
        if (resPerfil.ok) {
          const perfil = await resPerfil.json();
          nombreCompleto = `${perfil.nombres || ''} ${perfil.apellidos || ''}`.trim() || 'Usuario';
          const nombreEl = document.getElementById('nombrePaciente');
          const correoEl = document.getElementById('correoPaciente');
          if (nombreEl) nombreEl.textContent = nombreCompleto;
          if (correoEl) correoEl.textContent = email || '-';
        }
      } catch (e) {
        console.warn('Error al cargar perfil:', e);
      }
      
      // Guardar nombre para usar en Yape/Plin/Efectivo
      window.pacienteNombre = nombreCompleto;
      
      // Actualizar datos de Yape, Plin y Efectivo
      actualizarDatosYape(cita, precio, email);
      actualizarDatosPlin(cita, precio, email);
      actualizarDatosEfectivo(cita, precio, email);
      
      // Configurar el formulario de pago
      const formPago = document.getElementById('formPago');
      if (formPago) {
        // Remover listener anterior si existe
        const newFormPago = formPago.cloneNode(true);
        formPago.parentNode.replaceChild(newFormPago, formPago);
        
        // Agregar nuevo listener
        newFormPago.addEventListener('submit', async (e) => {
          e.preventDefault();
          await procesarPago(citaId, email, precio);
        });
      }
      
      // Configurar eventos de método de pago
      configurarMetodosPago();
      
      // Configurar formateo de campos de tarjeta
      configurarCamposTarjeta();
      
      // Configurar botones
      const btnVolver = document.getElementById('btnVolverPago');
      if (btnVolver) {
        btnVolver.onclick = () => loadSection('pagos');
      }
      
      const btnCancelar = document.getElementById('btnCancelarPago');
      if (btnCancelar) {
        btnCancelar.onclick = () => {
          mostrarModalCancelarPago(() => {
            loadSection('pagos');
          });
        };
      }
      
      const btnCerrarModal = document.getElementById('btnCerrarModal');
      if (btnCerrarModal) {
        btnCerrarModal.onclick = () => {
          document.getElementById('modalPago').style.display = 'none';
          loadSection('pagos');
        };
      }
      
    } catch (error) {
      console.error('Error inicializando formulario de pago:', error);
      alert('Error al cargar información de la cita: ' + error.message);
      loadSection('citas');
    }
  };
  
  // Función para actualizar datos de Yape
  const actualizarDatosYape = (cita, monto, email) => {
    const yapeNombre = document.getElementById('yapeNombrePaciente');
    const yapeCorreo = document.getElementById('yapeCorreoPaciente');
    const yapeFecha = document.getElementById('yapeFechaCita');
    const yapeHorario = document.getElementById('yapeHorarioCita');
    const yapeImporte = document.getElementById('yapeImporte');
    
    if (yapeNombre) yapeNombre.textContent = window.pacienteNombre || 'Usuario';
    if (yapeCorreo) yapeCorreo.textContent = email || '-';
    
    if (yapeFecha && cita.fechaCita) {
      const fecha = new Date(cita.fechaCita);
      yapeFecha.textContent = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    if (yapeHorario) yapeHorario.textContent = cita.horario || '-';
    if (yapeImporte) yapeImporte.textContent = `S/ ${monto.toFixed(2)}`;
    
    // Generar QR code para Yape
    generarQRYape(cita, monto, email);
  };
  
  // Función para actualizar datos de Plin
  const actualizarDatosPlin = (cita, monto, email) => {
    const plinNombre = document.getElementById('plinNombrePaciente');
    const plinCorreo = document.getElementById('plinCorreoPaciente');
    const plinFecha = document.getElementById('plinFechaCita');
    const plinHorario = document.getElementById('plinHorarioCita');
    const plinImporte = document.getElementById('plinImporte');
    
    if (plinNombre) plinNombre.textContent = window.pacienteNombre || 'Usuario';
    if (plinCorreo) plinCorreo.textContent = email || '-';
    
    if (plinFecha && cita.fechaCita) {
      const fecha = new Date(cita.fechaCita);
      plinFecha.textContent = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    if (plinHorario) plinHorario.textContent = cita.horario || '-';
    if (plinImporte) plinImporte.textContent = `S/ ${monto.toFixed(2)}`;
    
    // Generar QR para Plin
    generarQRPlin(cita, monto, email);
  };
  
  // Función para generar QR code de Plin
  const generarQRPlin = (cita, monto, email) => {
    const datosQR = JSON.stringify({
      tipo: 'plin',
      monto: monto.toFixed(2),
      referencia: `CITA-${cita._id}`,
      paciente: window.pacienteNombre || 'Usuario',
      fecha: new Date().toISOString()
    });
    
    const qrContainer = document.getElementById('qrCodePlin');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(datosQR)}`;
      const img = document.createElement('img');
      img.src = qrUrl;
      img.alt = 'QR Code Plin';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '8px';
      qrContainer.appendChild(img);
    }
  };

  // Función para actualizar datos de pago en efectivo
  const actualizarDatosEfectivo = (cita, monto, email) => {
    const efectivoNombre = document.getElementById('efectivoNombrePaciente');
    const efectivoCorreo = document.getElementById('efectivoCorreoPaciente');
    const efectivoFecha = document.getElementById('efectivoFechaCita');
    const efectivoHorario = document.getElementById('efectivoHorarioCita');
    const efectivoImporte = document.getElementById('efectivoImporte');
    const efectivoCodigo = document.getElementById('efectivoCodigo');
    
    if (efectivoNombre) efectivoNombre.textContent = window.pacienteNombre || 'Usuario';
    if (efectivoCorreo) efectivoCorreo.textContent = email || '-';
    
    if (efectivoFecha && cita.fechaCita) {
      const fecha = new Date(cita.fechaCita);
      efectivoFecha.textContent = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    if (efectivoHorario) efectivoHorario.textContent = cita.horario || '-';
    if (efectivoImporte) efectivoImporte.textContent = `S/ ${monto.toFixed(2)}`;
    
    // Generar código de pago en ventanilla basado en la cita
    if (efectivoCodigo) {
      const base = (cita._id || 'CITA').toString().slice(-6).toUpperCase();
      efectivoCodigo.textContent = `EF-${base}`;
    }
  };
  
  // Función para generar QR code de Yape
  const generarQRYape = (cita, monto, email) => {
    // Datos para el QR (simulando datos de pago Yape)
    const datosQR = JSON.stringify({
      tipo: 'yape',
      monto: monto.toFixed(2),
      referencia: `CITA-${cita._id}`,
      paciente: window.pacienteNombre || 'Usuario',
      fecha: new Date().toISOString()
    });
    
    // Usar API de QR code (qrcode.tec-it.com o similar)
    const qrContainer = document.getElementById('qrCodeYape');
    if (qrContainer) {
      // Limpiar contenido anterior
      qrContainer.innerHTML = '';
      
      // Crear imagen QR usando API pública
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(datosQR)}`;
      const img = document.createElement('img');
      img.src = qrUrl;
      img.alt = 'QR Code Yape';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '8px';
      qrContainer.appendChild(img);
    }
  };
  
  // Función para configurar métodos de pago
  const configurarMetodosPago = () => {
    const radios = document.querySelectorAll('input[name="metodo"]');
    const camposTarjeta = document.getElementById('camposTarjeta');
    const seccionYape = document.getElementById('seccionYape');
    const seccionPlin = document.getElementById('seccionPlin');
    const seccionEfectivo = document.getElementById('seccionEfectivo');
    
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const metodo = e.target.value;
        
        // Remover clase selected de todas las opciones
        document.querySelectorAll('.metodo-pago-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Agregar clase selected a la opción seleccionada
        const option = e.target.closest('.metodo-pago-option');
        if (option) option.classList.add('selected');
        
        // Mostrar/ocultar secciones según el método
        if (metodo === 'tarjeta') {
          if (camposTarjeta) camposTarjeta.style.display = 'block';
          if (seccionYape) seccionYape.style.display = 'none';
          if (seccionPlin) seccionPlin.style.display = 'none';
          if (seccionEfectivo) seccionEfectivo.style.display = 'none';
        } else if (metodo === 'yape') {
          if (camposTarjeta) camposTarjeta.style.display = 'none';
          if (seccionYape) seccionYape.style.display = 'block';
          if (seccionPlin) seccionPlin.style.display = 'none';
          if (seccionEfectivo) seccionEfectivo.style.display = 'none';
        } else if (metodo === 'plin') {
          if (camposTarjeta) camposTarjeta.style.display = 'none';
          if (seccionYape) seccionYape.style.display = 'none';
          if (seccionPlin) seccionPlin.style.display = 'block';
          if (seccionEfectivo) seccionEfectivo.style.display = 'none';
        } else if (metodo === 'efectivo') {
          if (camposTarjeta) camposTarjeta.style.display = 'none';
          if (seccionYape) seccionYape.style.display = 'none';
          if (seccionPlin) seccionPlin.style.display = 'none';
          if (seccionEfectivo) seccionEfectivo.style.display = 'block';
        } else {
          if (camposTarjeta) camposTarjeta.style.display = 'none';
          if (seccionYape) seccionYape.style.display = 'none';
          if (seccionPlin) seccionPlin.style.display = 'none';
          if (seccionEfectivo) seccionEfectivo.style.display = 'none';
        }
      });
    });
    
    // Activar el método por defecto (tarjeta)
    const tarjetaRadio = document.querySelector('input[name="metodo"][value="tarjeta"]');
    if (tarjetaRadio && camposTarjeta) {
      tarjetaRadio.checked = true;
      camposTarjeta.style.display = 'block';
      const option = tarjetaRadio.closest('.metodo-pago-option');
      if (option) option.classList.add('selected');
    }
  };
  
  // Función para configurar campos de tarjeta
  const configurarCamposTarjeta = () => {
    const numeroTarjeta = document.getElementById('numeroTarjeta');
    const fechaExpiracion = document.getElementById('fechaExpiracion');
    const cvv = document.getElementById('cvv');
    
    // Formatear número de tarjeta (espacios cada 4 dígitos)
    if (numeroTarjeta) {
      numeroTarjeta.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, ''); // Remover espacios
        value = value.replace(/\D/g, ''); // Solo números
        value = value.match(/.{1,4}/g)?.join(' ') || value; // Agregar espacios
        e.target.value = value;
      });
      
      numeroTarjeta.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') {
          e.preventDefault();
        }
      });
    }
    
    // Formatear fecha de expiración (MM/AA)
    if (fechaExpiracion) {
      fechaExpiracion.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Solo números
        if (value.length >= 2) {
          value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
      });
      
      fechaExpiracion.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') {
          e.preventDefault();
        }
      });
    }
    
    // Validar CVV (solo números)
    if (cvv) {
      cvv.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') {
          e.preventDefault();
        }
      });
    }
  };

  // Mostrar modal de confirmación de pago (ventana emergente personalizada)
  const mostrarModalConfirmacionPago = (monto, metodoNombre, onConfirm) => {
    const modal = document.getElementById('modalConfirmarPago');
    const tituloEl = document.getElementById('modalConfirmarTitulo');
    const mensajeEl = document.getElementById('modalConfirmarMensaje');
    const btnAceptar = document.getElementById('btnAceptarConfirmarPago');
    const btnCancelar = document.getElementById('btnCancelarConfirmarPago');

    if (!modal || !btnAceptar || !btnCancelar) {
      // Si por alguna razón no existe el modal, no bloquear el flujo
      if (typeof onConfirm === 'function') onConfirm();
      return;
    }

    if (tituloEl) tituloEl.textContent = 'Confirmar pago';
    if (mensajeEl) {
      mensajeEl.innerHTML = `
        <div style="text-align: left; margin-top: 0.5rem;">
          <p style="margin-bottom: 0.75rem;">
            ¿Confirmar el pago de <strong>S/ ${monto.toFixed(2)}</strong> mediante <strong>${metodoNombre}</strong>?
          </p>
          <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">
            Este pago quedará registrado en tu historial de pagos.
          </p>
        </div>
      `;
    }

    // Limpiar handlers anteriores
    btnAceptar.onclick = null;
    btnCancelar.onclick = null;

    btnAceptar.onclick = () => {
      modal.style.display = 'none';
      if (typeof onConfirm === 'function') onConfirm();
    };

    btnCancelar.onclick = () => {
      modal.style.display = 'none';
    };

    modal.style.display = 'flex';
  };

  // Mostrar modal de confirmación de cancelación de pago
  const mostrarModalCancelarPago = (onConfirm) => {
    const modal = document.getElementById('modalConfirmarPago');
    const tituloEl = document.getElementById('modalConfirmarTitulo');
    const mensajeEl = document.getElementById('modalConfirmarMensaje');
    const btnAceptar = document.getElementById('btnAceptarConfirmarPago');
    const btnCancelar = document.getElementById('btnCancelarConfirmarPago');

    if (!modal || !btnAceptar || !btnCancelar) {
      if (typeof onConfirm === 'function') onConfirm();
      return;
    }

    if (tituloEl) tituloEl.textContent = 'Cancelar pago';
    if (mensajeEl) {
      mensajeEl.innerHTML = `
        <p style="margin-bottom: 0.75rem;">
          ¿Está seguro que desea cancelar el pago?
        </p>
        <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">
          Podrás volver a intentarlo más tarde desde la sección <strong>Pagos</strong>.
        </p>
      `;
    }

    btnAceptar.onclick = () => {
      modal.style.display = 'none';
      if (typeof onConfirm === 'function') onConfirm();
    };

    btnCancelar.onclick = () => {
      modal.style.display = 'none';
    };

    modal.style.display = 'flex';
  };
  
  const procesarPago = async (citaId, email, montoBase, omitirConfirmacion = false) => {
    const btnConfirmarPago = document.getElementById('btnConfirmarPago');
    const metodoSeleccionado = document.querySelector('input[name="metodo"]:checked');
    const montoInput = document.getElementById('montoPago');
    
    // Obtener monto del input del formulario
    const monto = montoInput ? parseFloat(montoInput.value) : montoBase;
    
    if (!monto || isNaN(monto) || monto <= 0) {
      alert('El monto debe ser un número válido mayor a 0');
      return;
    }
    
    if (!citaId || !email) {
      alert('Faltan datos requeridos (citaId o email)');
      return;
    }
    
    if (!metodoSeleccionado) {
      alert('Por favor seleccione un método de pago');
      return;
    }
    
    const metodo = metodoSeleccionado.value;
    
    // Validar método
    const metodosValidos = ['tarjeta', 'yape', 'plin', 'efectivo'];
    if (!metodosValidos.includes(metodo)) {
      alert('Método de pago inválido');
      return;
    }
    
    // Validar campos de tarjeta si el método es tarjeta
    if (metodo === 'tarjeta') {
      const numeroTarjeta = document.getElementById('numeroTarjeta')?.value.replace(/\s/g, '');
      const fechaExpiracion = document.getElementById('fechaExpiracion')?.value;
      const cvv = document.getElementById('cvv')?.value;
      
      if (!numeroTarjeta || numeroTarjeta.length < 13 || numeroTarjeta.length > 19) {
        alert('Por favor ingrese un número de tarjeta válido (13-19 dígitos)');
        return;
      }
      
      if (!fechaExpiracion || !/^\d{2}\/\d{2}$/.test(fechaExpiracion)) {
        alert('Por favor ingrese una fecha de expiración válida (MM/AA)');
        return;
      }
      
      if (!cvv || cvv.length < 3 || cvv.length > 4) {
        alert('Por favor ingrese un CVV válido (3-4 dígitos)');
        return;
      }
    }
    
    // Nombre legible del método
    const metodoNombre = metodo === 'tarjeta' ? 'Tarjeta de Crédito/Débito' : 
                        metodo === 'yape' ? 'Yape' : 
                        metodo === 'plin' ? 'Plin' : 'Efectivo';

    // Mostrar confirmación en ventana emergente personalizada (no usar confirm del navegador)
    if (!omitirConfirmacion) {
      mostrarModalConfirmacionPago(monto, metodoNombre, () => {
        // Volver a llamar a procesarPago omitiendo la confirmación
        procesarPago(citaId, email, montoBase, true);
      });
      return;
    }
    
    // Deshabilitar botón
    if (btnConfirmarPago) {
      btnConfirmarPago.disabled = true;
      btnConfirmarPago.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>Procesando...';
    }
    
    try {
      console.log('Enviando pago:', { email, citaId, monto, metodo });
      
      const res = await fetch('http://localhost:5000/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, citaId, monto, metodo })
      });
      
      const data = await res.json();
      console.log('Respuesta del servidor:', data);
      
      if (!res.ok) {
        console.error('Error en la respuesta:', data);
        
        // Si la cita ya tiene pago, mostrar mensaje más amigable
        if (data.message && data.message.includes('ya tiene un pago registrado')) {
          alert('Esta cita ya tiene un pago registrado.\n\n' +
                (data.pagoExistente 
                  ? `Detalles del pago:\n- Monto: S/ ${data.pagoExistente.monto}\n- Método: ${data.pagoExistente.metodo}\n- Estado: ${data.pagoExistente.estado}\n\n` 
                  : '') +
                'Puedes ver tus pagos en la sección "Pagos".');
          loadSection('pagos');
          return;
        }
        
        throw new Error(data.message || 'Error al procesar el pago');
      }
      
      // Mostrar modal de éxito
      const modalPago = document.getElementById('modalPago');
      const modalTitulo = document.getElementById('modalTitulo');
      const modalMensaje = document.getElementById('modalMensaje');
      
      if (modalPago) modalPago.style.display = 'flex';
      if (modalTitulo) modalTitulo.textContent = '¡Pago Exitoso!';
      if (modalMensaje) {
        const metodoNombre = metodoSeleccionado.nextElementSibling.querySelector('span').textContent;
        modalMensaje.innerHTML = `
          <div style="text-align: left; margin-top: 1rem;">
            <p style="margin-bottom: 0.75rem;">Su pago ha sido procesado correctamente.</p>
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong>Monto:</strong>
                <span style="color: #059669; font-weight: 700;">S/ ${monto.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong>Método:</strong>
                <span>${metodoNombre}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <strong>Estado:</strong>
                <span style="color: #059669; font-weight: 600;">✓ Pagado</span>
              </div>
            </div>
          </div>
        `;
      }
      
      // Limpiar sessionStorage
      sessionStorage.removeItem('ultimaCitaId');
      
      // Cerrar el modal después de mostrar el mensaje
      setTimeout(() => {
        if (modalPago) modalPago.style.display = 'none';
        
        // Redirigir a la vista de pagos para ver el nuevo pago
        // Esperar un poco más para asegurar que el backend haya procesado completamente
        if (typeof loadSection === 'function') {
          console.log('Redirigiendo a la vista de pagos...');
          loadSection('pagos');
          
          // Forzar la recarga de pagos después de un delay más largo para asegurar que el backend haya guardado
          // Usar múltiples intentos para asegurar que la tabla se cargue
          let intentosRecarga = 0;
          const maxIntentosRecarga = 10;
          const recargarPagos = () => {
            intentosRecarga++;
            const tbody = document.getElementById('pagos-tbody-modern');
            if (tbody && typeof window.cargarPagosEnTabla === 'function') {
              console.log(`Recargando tabla de pagos... (intento ${intentosRecarga})`);
              window.cargarPagosEnTabla();
              // Verificar después de cargar si hay datos
              setTimeout(() => {
                const filas = tbody.querySelectorAll('tr');
                console.log(`Tabla recargada: ${filas.length} filas encontradas`);
              }, 1000);
            } else if (intentosRecarga < maxIntentosRecarga) {
              setTimeout(recargarPagos, 400);
            } else {
              console.warn('No se pudo recargar la tabla de pagos después de varios intentos');
            }
          };
          // Empezar después de un delay más largo para dar tiempo al backend
          setTimeout(recargarPagos, 800);
        } else {
          window.location.href = '/user';
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error al procesar pago:', error);
      alert('Error: ' + (error.message || 'Error al procesar el pago') + '\n\nPor favor, verifique la consola para más detalles.');
      
      if (btnConfirmarPago) {
        btnConfirmarPago.disabled = false;
        btnConfirmarPago.innerHTML = '<i class="fa-solid fa-check" style="margin-right: 0.5rem;"></i>Confirmar Pago';
      }
    }
  };

  const initPagosView = async () => {
    // Esta función se ejecuta cuando se carga la sección de pagos dinámicamente
    const email = sessionStorage.getItem("userEmail");
    if (!email) {
      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = `<p style="color:crimson;padding:2rem;">No se encontró el email del usuario. Por favor, inicie sesión nuevamente.</p>`;
      }
      return;
    }
    
    // Esperar a que el DOM se actualice completamente
    const cargarPagos = () => {
      const tbody = document.getElementById('pagos-tbody-modern');
      if (tbody && typeof window.cargarPagosEnTabla === 'function') {
        window.cargarPagosEnTabla();
        return true;
      }
      return false;
    };
    
    // Intentar cargar inmediatamente
    if (!cargarPagos()) {
      // Si no está listo, intentar varias veces con delays progresivos
      let intentos = 0;
      const maxIntentos = 10;
      const intervalo = setInterval(() => {
        intentos++;
        if (cargarPagos() || intentos >= maxIntentos) {
          clearInterval(intervalo);
          if (intentos >= maxIntentos) {
            console.warn('No se pudo cargar la tabla de pagos después de varios intentos');
          }
        }
      }, 150);
    }
  };

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
      const email = sessionStorage.getItem("userEmail");
      if (!email) {
        const cardMedicacion = document.getElementById("card-medicacion");
        if (cardMedicacion) cardMedicacion.style.display = "none";
        return;
      }

      // Obtener diagnósticos con recetas del paciente
      const res = await fetch(`/api/diagnosticos/email?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const cardMedicacion = document.getElementById("card-medicacion");
        if (cardMedicacion) cardMedicacion.style.display = "none";
        return;
      }
      const diagnosticos = await res.json();
      
      // Filtrar solo diagnósticos con recetas activas
      const recetasActivas = [];
      diagnosticos.forEach(diagnostico => {
        if (diagnostico.receta && diagnostico.receta.tieneReceta && diagnostico.receta.medicamentos.length > 0) {
          diagnostico.receta.medicamentos.forEach(med => {
            recetasActivas.push({
              ...med,
              diagnosticoId: diagnostico._id,
              fechaDiagnostico: diagnostico.fechaDiagnostico,
              medico: diagnostico.idMedico ? `${diagnostico.idMedico.nombres} ${diagnostico.idMedico.apellidos}` : "Médico"
            });
          });
        }
      });
      
      const cardMedicacion = document.getElementById("card-medicacion");
      if (!cardMedicacion) return;

      if (recetasActivas.length === 0) {
        cardMedicacion.style.display = "none";
        return;
      }

      // Mostrar información en el overview
      cardMedicacion.style.display = "block";
      const medicacionTipo = document.getElementById("medicacion-tipo");
      const medicacionDetalle = document.getElementById("medicacion-detalle");
      if (medicacionTipo) medicacionTipo.textContent = recetasActivas[0].nombre;
      if (medicacionDetalle) medicacionDetalle.textContent = `${recetasActivas.length} ${recetasActivas.length === 1 ? "medicamento activo" : "medicamentos activos"}`;
    } catch (err) {
      console.error("Error cargando medicación:", err);
      const cardMedicacion = document.getElementById("card-medicacion");
      if (cardMedicacion) cardMedicacion.style.display = "none";
    }
  };

  // ============================================================
  // 🔹 VISTA DE MEDICACIÓN
  // ============================================================
  const initMedicacionView = async () => {
    const email = sessionStorage.getItem("userEmail");
    if (!email) {
      console.error("No se encontró el email del usuario");
      mostrarEstadoVacioMedicacion();
      return;
    }

    // Mostrar estado de carga
    mostrarEstadoCargaMedicacion();

    try {
      // Obtener diagnósticos con recetas
      const res = await fetch(`/api/diagnosticos/email?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Error al obtener diagnósticos");
      
      const diagnosticos = await res.json();
      
      // Procesar recetas
      const todasLasRecetas = [];
      diagnosticos.forEach(diagnostico => {
        if (diagnostico.receta && diagnostico.receta.tieneReceta && diagnostico.receta.medicamentos.length > 0) {
          diagnostico.receta.medicamentos.forEach((med, index) => {
            todasLasRecetas.push({
              ...med,
              id: `${diagnostico._id}-${index}`,
              diagnosticoId: diagnostico._id,
              fechaDiagnostico: diagnostico.fechaDiagnostico,
              medico: diagnostico.idMedico ? `${diagnostico.idMedico.nombres} ${diagnostico.idMedico.apellidos}` : "Médico",
              diagnostico: diagnostico.diagnostico
            });
          });
        }
      });

      if (todasLasRecetas.length === 0) {
        mostrarEstadoVacioMedicacion();
        return;
      }

      // Renderizar medicamentos
      renderizarMedicamentos(todasLasRecetas);
      inicializarRecordatoriosMedicacion();
      
    } catch (err) {
      console.error("Error cargando medicación:", err);
      mostrarEstadoVacioMedicacion();
    }
  };

  const mostrarEstadoCargaMedicacion = () => {
    const loadingEl = document.getElementById("loading-medicacion");
    const emptyEl = document.getElementById("empty-medicacion");
    const contentEl = document.getElementById("medicacion-content");
    if (loadingEl) loadingEl.style.display = "block";
    if (emptyEl) emptyEl.style.display = "none";
    if (contentEl) contentEl.style.display = "none";
  };

  const mostrarEstadoVacioMedicacion = () => {
    const loadingEl = document.getElementById("loading-medicacion");
    const emptyEl = document.getElementById("empty-medicacion");
    const contentEl = document.getElementById("medicacion-content");
    if (loadingEl) loadingEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "block";
    if (contentEl) contentEl.style.display = "none";
  };

  const renderizarMedicamentos = (recetas) => {
    const loadingEl = document.getElementById("loading-medicacion");
    const emptyEl = document.getElementById("empty-medicacion");
    const contentEl = document.getElementById("medicacion-content");
    if (loadingEl) loadingEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "none";
    if (contentEl) contentEl.style.display = "block";

    const medList = document.getElementById("med-list");
    if (!medList) return;
    
    medList.innerHTML = "";

    recetas.forEach(receta => {
      const recordatorio = obtenerRecordatorioMedicacion(receta.id);
      const tieneRecordatorio = recordatorio && recordatorio.activo;
      
      const li = document.createElement("li");
      li.className = "med-item";
      li.dataset.medicamentoId = receta.id;
      
      li.innerHTML = `
        <div class="med-icon"><i class="fa-solid fa-capsules"></i></div>
        <div class="med-info">
          <div class="med-name">${receta.nombre}</div>
          <div class="med-details">
            ${receta.dosis} — ${receta.frecuencia} — ${receta.duracion}
            ${receta.instrucciones ? `<br><small class="med-instructions">${receta.instrucciones}</small>` : ''}
          </div>
          <div class="med-meta">
            <small class="muted">Prescrito por: ${receta.medico} · ${new Date(receta.fechaDiagnostico).toLocaleDateString('es-ES')}</small>
          </div>
        </div>
        <div class="med-actions">
          ${tieneRecordatorio 
            ? `<span class="badge badge-success"><i class="fa-solid fa-bell"></i> Activo ${recordatorio.hora}</span>`
            : `<button class="btn-recordatorio" data-medicamento-id="${receta.id}">
                <i class="fa-solid fa-bell"></i> Recordatorio
              </button>`
          }
          ${tieneRecordatorio 
            ? `<button class="btn-editar-recordatorio" data-medicamento-id="${receta.id}" title="Editar recordatorio">
                <i class="fa-solid fa-edit"></i>
              </button>`
            : ''
          }
        </div>
      `;
      
      medList.appendChild(li);
    });

    // Guardar recetas en variable global para acceso en modal
    window.recetasMedicacion = recetas;

    // Agregar event listeners para recordatorios
    document.querySelectorAll(".btn-recordatorio").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const medicamentoId = e.currentTarget.dataset.medicamentoId;
        abrirModalRecordatorioMedicacion(medicamentoId);
      });
    });

    document.querySelectorAll(".btn-editar-recordatorio").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const medicamentoId = e.currentTarget.dataset.medicamentoId;
        abrirModalRecordatorioMedicacion(medicamentoId);
      });
    });
  };

  // ============================================================
  // 🔹 SISTEMA DE RECORDATORIOS
  // ============================================================
  const obtenerRecordatorioMedicacion = (medicamentoId) => {
    const recordatorios = JSON.parse(localStorage.getItem("recordatorios") || "{}");
    return recordatorios[medicamentoId] || null;
  };

  const guardarRecordatorioMedicacion = (medicamentoId, recordatorio) => {
    const recordatorios = JSON.parse(localStorage.getItem("recordatorios") || "{}");
    recordatorios[medicamentoId] = recordatorio;
    localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
  };

  const eliminarRecordatorioMedicacion = (medicamentoId) => {
    const recordatorios = JSON.parse(localStorage.getItem("recordatorios") || "{}");
    delete recordatorios[medicamentoId];
    localStorage.setItem("recordatorios", JSON.stringify(recordatorios));
  };

  const abrirModalRecordatorioMedicacion = (medicamentoId) => {
    const recetas = window.recetasMedicacion || [];
    const receta = recetas.find(r => r.id === medicamentoId);
    if (!receta) return;

    const recordatorio = obtenerRecordatorioMedicacion(medicamentoId);
    
    const medicamentoIdInput = document.getElementById("recordatorio-medicamento-id");
    const medicamentoNombreInput = document.getElementById("recordatorio-medicamento-nombre");
    const horaInput = document.getElementById("recordatorio-hora");
    const activoInput = document.getElementById("recordatorio-activo");

    if (medicamentoIdInput) medicamentoIdInput.value = medicamentoId;
    if (medicamentoNombreInput) medicamentoNombreInput.value = receta.nombre;
    if (horaInput) horaInput.value = recordatorio ? recordatorio.hora : "09:00";
    if (activoInput) activoInput.checked = recordatorio ? recordatorio.activo : false;

    const modal = document.getElementById("modal-recordatorio");
    if (modal) modal.classList.remove("hidden");
  };

  const cerrarModalRecordatorioMedicacion = () => {
    const modal = document.getElementById("modal-recordatorio");
    if (modal) modal.classList.add("hidden");
    const form = document.getElementById("form-recordatorio");
    if (form) form.reset();
  };

  const inicializarRecordatoriosMedicacion = () => {
    // Event listeners del modal
    const modal = document.getElementById("modal-recordatorio");
    const formRecordatorio = document.getElementById("form-recordatorio");
    const btnClose = document.getElementById("btn-close-recordatorio");
    const btnCancelar = document.getElementById("btn-cancelar-recordatorio");

    if (btnClose) {
      btnClose.addEventListener("click", cerrarModalRecordatorioMedicacion);
    }

    if (btnCancelar) {
      btnCancelar.addEventListener("click", cerrarModalRecordatorioMedicacion);
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          cerrarModalRecordatorioMedicacion();
        }
      });
    }

    if (formRecordatorio) {
      formRecordatorio.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const medicamentoIdInput = document.getElementById("recordatorio-medicamento-id");
        const horaInput = document.getElementById("recordatorio-hora");
        const activoInput = document.getElementById("recordatorio-activo");

        if (!medicamentoIdInput || !horaInput || !activoInput) return;

        const medicamentoId = medicamentoIdInput.value;
        const hora = horaInput.value;
        const activo = activoInput.checked;

        if (activo) {
          guardarRecordatorioMedicacion(medicamentoId, {
            hora,
            activo: true,
            fechaCreacion: new Date().toISOString()
          });
          
          // Configurar notificación
          configurarNotificacionMedicacion(medicamentoId, hora);
        } else {
          eliminarRecordatorioMedicacion(medicamentoId);
        }

        cerrarModalRecordatorioMedicacion();
        initMedicacionView(); // Recargar vista
      });
    }

    // Botón configurar recordatorios (vista general)
    const btnConfigurar = document.getElementById("btn-configurar-recordatorios");
    if (btnConfigurar) {
      btnConfigurar.addEventListener("click", () => {
        alert("Selecciona un medicamento individual para configurar su recordatorio.");
      });
    }

    // Los recordatorios ya se verifican globalmente, no es necesario iniciar otro intervalo aquí
  };

  const configurarNotificacionMedicacion = (medicamentoId, hora) => {
    // Solicitar permiso para notificaciones
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const verificarRecordatoriosMedicacion = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const recordatorios = JSON.parse(localStorage.getItem("recordatorios") || "{}");
    const ahora = new Date();
    const horaActual = ahora.getHours().toString().padStart(2, "0") + ":" + ahora.getMinutes().toString().padStart(2, "0");

    Object.keys(recordatorios).forEach(medicamentoId => {
      const recordatorio = recordatorios[medicamentoId];
      if (!recordatorio.activo) return;

      const [hora, minutos] = recordatorio.hora.split(":");
      const horaRecordatorio = hora.padStart(2, "0") + ":" + minutos.padStart(2, "0");

      // Verificar si es la hora del recordatorio (con margen de 1 minuto)
      if (horaRecordatorio === horaActual) {
        // Verificar si ya se mostró hoy
        const ultimaNotificacion = recordatorio.ultimaNotificacion;
        const hoy = ahora.toDateString();

        if (!ultimaNotificacion || new Date(ultimaNotificacion).toDateString() !== hoy) {
          mostrarNotificacionMedicacion(medicamentoId, recordatorio);
          
          // Actualizar última notificación
          recordatorio.ultimaNotificacion = ahora.toISOString();
          guardarRecordatorioMedicacion(medicamentoId, recordatorio);
        }
      }
    });
  };

  const mostrarNotificacionMedicacion = async (medicamentoId, recordatorio) => {
    // Obtener nombre del medicamento desde el DOM
    const medItem = document.querySelector(`[data-medicamento-id="${medicamentoId}"]`);
    const nombreMedicamento = medItem 
      ? medItem.querySelector(".med-name")?.textContent 
      : "Medicamento";

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Recordatorio de Medicación", {
        body: `Es hora de tomar: ${nombreMedicamento}`,
        icon: "/assets2/img/logo.jpg",
        tag: `medicacion-${medicamentoId}`,
        requireInteraction: false
      });
    }

    // Mostrar también una notificación en la página si está abierta
    mostrarNotificacionEnPaginaMedicacion(nombreMedicamento);
  };

  const mostrarNotificacionEnPaginaMedicacion = (nombreMedicamento) => {
    // Crear elemento de notificación temporal
    const notification = document.createElement("div");
    notification.className = "notification-toast";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      max-width: 300px;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="fa-solid fa-bell" style="font-size: 1.25rem;"></i>
        <div>
          <strong style="display: block; margin-bottom: 0.25rem;">Recordatorio de Medicación</strong>
          <p style="margin: 0; font-size: 0.9rem;">Es hora de tomar: ${nombreMedicamento}</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);

    // Animación de entrada
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // Remover después de 5 segundos
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  };

  // ============================================================
  // 🔹 INICIALIZACIÓN DE RECORDATORIOS GLOBAL
  // ============================================================
  const inicializarRecordatoriosGlobal = () => {
    // Inicializar verificación de recordatorios
    verificarRecordatoriosMedicacion();
    // Verificar cada minuto
    setInterval(verificarRecordatoriosMedicacion, 60000);
  };

  // ============================================================
  // 🔹 VISTA DE DOCTORES
  // ============================================================
  const initDoctoresView = async () => {
    const doctoresContainer = document.getElementById("doctoresContainer");
    const noDoctoresMessage = document.getElementById("noDoctoresMessage");
    
    if (!doctoresContainer) return;

    try {
      // Mostrar mensaje de carga
      doctoresContainer.innerHTML = `
        <div class="loading-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <p>Cargando doctores...</p>
        </div>
      `;
      noDoctoresMessage.classList.add("hidden");

      // Obtener todos los doctores del backend
      const response = await fetch("/api/personal");
      if (!response.ok) {
        throw new Error("Error al cargar los doctores");
      }

      const personal = await response.json();
      
      // Filtrar solo los médicos activos
      const doctores = personal.filter(
        (persona) => persona.cargo === "medico" && persona.estado === "activo"
      );

      if (doctores.length === 0) {
        doctoresContainer.innerHTML = "";
        noDoctoresMessage.classList.remove("hidden");
        return;
      }

      // Renderizar doctores
      doctoresContainer.innerHTML = doctores
        .map((doctor) => {
          const nombreCompleto = `${doctor.nombres} ${doctor.apellidos}`;
          const genero = doctor.genero || "masculino";
          const titulo = genero === "femenino" ? "Dra." : "Dr.";
          const especialidad = doctor.especialidad || "Medicina General";
          
          // Imagen por defecto o del doctor si existe
          let imagenDoctor;
          if (doctor.imagen) {
            // Si la imagen ya incluye /uploads, usarla tal cual; si no, construir la ruta completa
            imagenDoctor = doctor.imagen.startsWith('/uploads') 
              ? doctor.imagen 
              : `/uploads/${doctor.imagen}`;
          } else {
            imagenDoctor = doctor.genero === "femenino"
              ? "assets2/img/doctores/dra-ana.jpg"
              : "assets2/img/doctores/dr-luis.jpg";
          }

          return `
            <div class="card doctor">
              <img src="${imagenDoctor}" alt="${titulo} ${nombreCompleto}" class="doc-avatar" 
                   onerror="this.src='${doctor.genero === 'femenino' ? 'assets2/img/doctores/dra-ana.jpg' : 'assets2/img/doctores/dr-luis.jpg'}'" />
              <div class="doc-info">
                <div class="doc-name">${titulo} ${nombreCompleto}</div>
                <div class="doc-specialty">${especialidad}</div>
                <div class="doc-actions">
                  <button class="chip small" onclick="verPerfilDoctor('${doctor._id}')">Ver perfil</button>
                  <button class="chip secondary small" onclick="agendarCitaConDoctor('${doctor._id}', '${especialidad}')">Agendar cita</button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      noDoctoresMessage.classList.add("hidden");
    } catch (error) {
      console.error("Error al cargar doctores:", error);
      doctoresContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #dc2626;">
          <p>Error al cargar los doctores. Por favor, intenta de nuevo más tarde.</p>
        </div>
      `;
      noDoctoresMessage.classList.add("hidden");
    }
  };

  // Función para ver perfil del doctor
  window.verPerfilDoctor = (doctorId) => {
    sessionStorage.setItem("currentDoctorId", doctorId);
    loadSection("perfil-doctor");
  };

  // Función para agendar cita con un doctor específico
  window.agendarCitaConDoctor = (doctorId, especialidad) => {
    // Guardar el ID del doctor y su especialidad en sessionStorage
    sessionStorage.setItem("doctorSeleccionadoId", doctorId);
    sessionStorage.setItem("especialidadSeleccionada", especialidad);
    // Cargar la vista de solicitar cita
    loadSection("solicitar-cita");
  };

  // ============================================================
  // 🔹 VISTA DE PERFIL DEL DOCTOR
  // ============================================================
  const initPerfilDoctorView = async () => {
    const doctorId = sessionStorage.getItem("currentDoctorId");
    
    if (!doctorId) {
      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = `<p style="color:crimson;padding:2rem;">No se ha seleccionado ningún doctor.</p>`;
      }
      return;
    }

    try {
      // Obtener información del doctor (sin email ni celular para pacientes)
      const response = await fetch(`/api/personal/${doctorId}?paciente=true`);
      if (!response.ok) {
        throw new Error("Error al cargar el perfil del doctor");
      }

      const doctor = await response.json();

      // Verificar que es un médico
      if (doctor.cargo !== "medico") {
        throw new Error("Este perfil no es de un médico");
      }

      // Configurar botón de volver
      const btnVolverDoctores = document.getElementById("btnVolverDoctores");
      if (btnVolverDoctores) {
        // Remover listeners anteriores si existen
        const newBtn = btnVolverDoctores.cloneNode(true);
        btnVolverDoctores.parentNode.replaceChild(newBtn, btnVolverDoctores);
        
        newBtn.addEventListener("click", () => {
          sessionStorage.removeItem("currentDoctorId");
          loadSection("doctores");
        });
      }

      // Configurar imagen
      const doctorAvatar = document.getElementById("doctor-profile-avatar");
      const nombreCompleto = `${doctor.nombres} ${doctor.apellidos}`;
      const genero = doctor.genero || "masculino";
      const titulo = genero === "femenino" ? "Dra." : "Dr.";
      
      if (doctorAvatar) {
        if (doctor.imagen) {
          // Si la imagen ya incluye /uploads, usarla tal cual; si no, construir la ruta completa
          doctorAvatar.src = doctor.imagen.startsWith('/uploads') 
            ? doctor.imagen 
            : `/uploads/${doctor.imagen}`;
        } else {
          doctorAvatar.src = genero === "femenino" 
            ? "assets2/img/doctores/dra-ana.jpg" 
            : "assets2/img/doctores/dr-luis.jpg";
        }
        doctorAvatar.alt = `${titulo} ${nombreCompleto}`;
      }

      // Configurar nombre y especialidad
      const doctorName = document.getElementById("doctor-profile-name");
      if (doctorName) {
        doctorName.textContent = `${titulo} ${nombreCompleto}`;
      }

      const doctorSpecialty = document.getElementById("doctor-profile-specialty");
      if (doctorSpecialty) {
        doctorSpecialty.textContent = doctor.especialidad || "Medicina General";
      }

      // Configurar estado
      const doctorStatus = document.getElementById("doctor-profile-status");
      if (doctorStatus) {
        const estado = doctor.estado || "activo";
        doctorStatus.textContent = estado === "activo" ? "Disponible" : 
                                   estado === "vacaciones" ? "En vacaciones" : "No disponible";
        doctorStatus.className = `doctor-status-badge ${estado}`;
      }

      // Configurar información personal
      const doctorEdad = document.getElementById("doctor-profile-edad");
      if (doctorEdad) {
        doctorEdad.textContent = doctor.edad ? `${doctor.edad} años` : "-";
      }

      const doctorGenero = document.getElementById("doctor-profile-genero");
      if (doctorGenero) {
        const generoText = genero === "femenino" ? "Femenino" : 
                          genero === "masculino" ? "Masculino" : 
                          genero === "otro" ? "Otro" : "No especificado";
        doctorGenero.textContent = generoText;
      }

      // Configurar horarios de disponibilidad
      const doctorHorarios = document.getElementById("doctor-profile-horarios");
      if (doctorHorarios) {
        if (doctor.horariosDisponibilidad && doctor.horariosDisponibilidad.length > 0) {
          const diasSemana = {
            "lunes": "Lunes",
            "martes": "Martes",
            "miercoles": "Miércoles",
            "jueves": "Jueves",
            "viernes": "Viernes",
            "sabado": "Sábado",
            "domingo": "Domingo"
          };

          const horariosDisponibles = doctor.horariosDisponibilidad
            .filter(horario => horario.disponible)
            .map(horario => {
              const dia = diasSemana[horario.diaSemana] || horario.diaSemana;
              return `
                <div class="horario-item">
                  <span class="horario-dia">${dia}</span>
                  <span class="horario-hora">${horario.horaInicio} - ${horario.horaFin}</span>
                </div>
              `;
            })
            .join("");

          doctorHorarios.innerHTML = horariosDisponibles || "<p class='muted'>No hay horarios de disponibilidad registrados.</p>";
        } else {
          doctorHorarios.innerHTML = "<p class='muted'>No hay horarios de disponibilidad registrados.</p>";
        }
      }

      // Configurar botón de agendar cita
      const btnAgendarCitaDoctor = document.getElementById("btnAgendarCitaDoctor");
      if (btnAgendarCitaDoctor) {
        // Remover listeners anteriores si existen
        const newBtn = btnAgendarCitaDoctor.cloneNode(true);
        btnAgendarCitaDoctor.parentNode.replaceChild(newBtn, btnAgendarCitaDoctor);
        
        newBtn.addEventListener("click", () => {
          // Guardar el ID del doctor y su especialidad para el formulario
          sessionStorage.setItem("doctorSeleccionadoId", doctorId);
          sessionStorage.setItem("especialidadSeleccionada", doctor.especialidad || "Medicina General");
          sessionStorage.removeItem("currentDoctorId");
          loadSection("solicitar-cita");
        });
      }

    } catch (error) {
      console.error("Error al cargar perfil del doctor:", error);
      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = `
          <div style="padding: 2rem; text-align: center;">
            <p style="color: #dc2626; margin-bottom: 1rem;">Error al cargar el perfil del doctor: ${error.message}</p>
            <button class="btn btn-primary" id="btnVolverError">
              <i class="fa-solid fa-arrow-left"></i> Volver a Doctores
            </button>
          </div>
        `;
        
        // Configurar botón de volver en caso de error
        const btnVolverError = document.getElementById("btnVolverError");
        if (btnVolverError) {
          btnVolverError.addEventListener("click", () => {
            sessionStorage.removeItem("currentDoctorId");
            loadSection("doctores");
          });
        }
      }
    }
  };

  // ============================================================
  // 🔹 VISTA DE HISTORIAL MÉDICO
  // ============================================================
  const initHistorialView = async () => {
    const email = sessionStorage.getItem("userEmail");
    if (!email) {
      console.error("No se encontró el email del usuario");
      mostrarEstadoVacioHistorial();
      return;
    }

    // Mostrar estado de carga
    mostrarEstadoCargaHistorial();

    try {
      // Obtener historial médico completo
      const res = await fetch(`http://localhost:5000/api/pacientes/historial?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Error al obtener historial médico");
      
      const data = await res.json();
      const { historial, resumen } = data;

      if (!historial || historial.length === 0) {
        mostrarEstadoVacioHistorial();
        return;
      }

      // Renderizar historial
      renderizarHistorial(historial);
      
    } catch (err) {
      console.error("Error cargando historial médico:", err);
      mostrarEstadoVacioHistorial();
    }
  };

  const mostrarEstadoCargaHistorial = () => {
    const loadingEl = document.getElementById("loading-historial");
    const emptyEl = document.getElementById("empty-historial");
    const contentEl = document.getElementById("historial-content");
    if (loadingEl) loadingEl.style.display = "block";
    if (emptyEl) emptyEl.style.display = "none";
    if (contentEl) contentEl.style.display = "none";
  };

  const mostrarEstadoVacioHistorial = () => {
    const loadingEl = document.getElementById("loading-historial");
    const emptyEl = document.getElementById("empty-historial");
    const contentEl = document.getElementById("historial-content");
    if (loadingEl) loadingEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "block";
    if (contentEl) contentEl.style.display = "none";
  };

  const renderizarHistorial = (historial) => {
    const loadingEl = document.getElementById("loading-historial");
    const emptyEl = document.getElementById("empty-historial");
    const contentEl = document.getElementById("historial-content");
    if (loadingEl) loadingEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "none";
    if (contentEl) contentEl.style.display = "block";

    const timelineEl = document.getElementById("historial-timeline");
    if (!timelineEl) return;

    timelineEl.innerHTML = "";

    historial.forEach((evento) => {
      const item = document.createElement("div");
      item.className = "timeline-item";

      // Determinar ícono según el tipo de evento
      let icono = "fa-calendar-check";
      if (evento.tipo === "diagnostico") {
        icono = "fa-user-doctor";
      } else if (evento.tipo === "resultado") {
        icono = "fa-vials";
      } else if (evento.tipo === "cita") {
        if (evento.motivoCita && evento.motivoCita.includes("Análisis")) {
          icono = "fa-flask";
        } else {
          icono = "fa-calendar-check";
        }
      }

      // Formatear fecha
      const fecha = new Date(evento.fecha);
      const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });

      // Construir contenido según el tipo
      let contenidoHTML = "";

      if (evento.tipo === "diagnostico") {
        // Mostrar información del diagnóstico
        contenidoHTML = `
          <h3>${evento.titulo}</h3>
          <p class="muted">${evento.subtitulo}</p>
          <p>${evento.descripcion}</p>
          ${evento.especialidad ? `<p style="margin-top: 0.5rem;"><strong>Especialidad:</strong> ${evento.especialidad}</p>` : ''}
          ${evento.sintomas ? `<p><strong>Síntomas:</strong> ${evento.sintomas}</p>` : ''}
          ${evento.observaciones ? `<p><strong>Observaciones:</strong> ${evento.observaciones}</p>` : ''}
          ${evento.tieneReceta && evento.receta.length > 0 ? `
            <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e0e0e0;">
              <strong>Medicación prescrita:</strong>
              <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                ${evento.receta.map(med => `
                  <li>${med.nombre} - ${med.dosis} (${med.frecuencia}) por ${med.duracion}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        `;
      } else if (evento.tipo === "resultado") {
        // Mostrar información del resultado
        const urlResultado = evento.archivoPDF ? `http://localhost:5000${evento.archivoPDF}` : '';
        contenidoHTML = `
          <h3>${evento.titulo}</h3>
          <p class="muted">${evento.subtitulo}</p>
          <p>${evento.descripcion}</p>
          ${evento.observaciones ? `<p><strong>Observaciones:</strong> ${evento.observaciones}</p>` : ''}
          ${urlResultado ? `
            <a href="javascript:void(0)" onclick="window.verResultadoPDF('${evento.id}', '${evento.nombreArchivo || 'Resultado'}')" style="display: inline-block; margin-top: 0.5rem; color: #007bff; text-decoration: none; cursor: pointer;">
              <i class="fa-solid fa-file-pdf"></i> Ver resultado completo
            </a>
          ` : ''}
        `;
      } else if (evento.tipo === "cita") {
        // Mostrar información de la cita desglosada
        const estadoLower = (evento.estado || "pendiente").toLowerCase();
        let estadoClass = "warning";
        let estadoColor = "#f59e0b"; // Amarillo por defecto
        
        if (estadoLower === "completada") {
          estadoClass = "success";
          estadoColor = "#22c55e"; // Verde
        } else if (estadoLower === "confirmada") {
          estadoClass = "primary";
          estadoColor = "#1976d2"; // Azul
        } else if (estadoLower === "pendiente") {
          estadoClass = "warning";
          estadoColor = "#f59e0b"; // Amarillo
        } else if (estadoLower === "cancelada") {
          estadoClass = "danger";
          estadoColor = "#e74c3c"; // Rojo
        }
        
        // Formatear fecha y horario de manera más detallada
        const fechaObj = new Date(evento.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
        
        // Formatear horario si está disponible
        const horarioFormateado = evento.horario || '';
        
        // Construir el subtítulo con especialidad, fecha y horario
        let subtitulo = '';
        if (evento.especialidad) {
          subtitulo = `${evento.especialidad} - ${fechaFormateada}`;
          if (horarioFormateado) {
            subtitulo += ` ${horarioFormateado}`;
          }
        } else {
          subtitulo = `${fechaFormateada}${horarioFormateado ? ' ' + horarioFormateado : ''}`;
        }
        
        // Verificar si hay diagnósticos o resultados relacionados
        const tieneDiagnosticos = evento.diagnosticos && evento.diagnosticos.length > 0;
        const tieneResultados = evento.resultados && evento.resultados.length > 0;
        
        contenidoHTML = `
          <h3>${evento.titulo}</h3>
          <p class="muted" style="margin-bottom: 0.5rem; font-size: 0.9rem;">
            ${subtitulo}
          </p>
          ${evento.motivoCita ? `<p style="margin: 0.5rem 0; color: #555; font-size: 0.9rem;">${evento.motivoCita}</p>` : ''}
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
            <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
              ${evento.especialidad ? `
                <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                  <strong style="color: #333; min-width: 90px; flex-shrink: 0;">Especialidad:</strong>
                  <span style="color: #555;">${evento.especialidad}</span>
                </div>
              ` : ''}
              ${horarioFormateado ? `
                <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                  <strong style="color: #333; min-width: 90px; flex-shrink: 0;">Horario:</strong>
                  <span style="color: #555;">${horarioFormateado}</span>
                </div>
              ` : ''}
              ${evento.motivoCita ? `
                <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                  <strong style="color: #333; min-width: 90px; flex-shrink: 0;">Motivo:</strong>
                  <span style="color: #555;">${evento.motivoCita}</span>
                </div>
              ` : ''}
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                <strong style="color: #333; min-width: 90px; flex-shrink: 0;">Estado:</strong>
                <span class="badge badge-${estadoClass}" style="background: ${estadoColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 0.25rem; font-size: 0.875rem; text-transform: capitalize; font-weight: 600;">
                  ${evento.estado || 'Pendiente'}
          </span>
              </div>
            </div>
          </div>
          ${(tieneDiagnosticos || tieneResultados) ? `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e5e7eb;">
              ${tieneDiagnosticos ? `
                <div style="margin-bottom: ${tieneResultados ? '1.5rem' : '0'};">
                  <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #1976d2; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-user-doctor"></i>
                    Consultas médicas relacionadas (${evento.diagnosticos.length})
                  </h4>
                  ${evento.diagnosticos.map((diag, idx) => {
                    const fechaDiag = new Date(diag.fecha).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    });
                    return `
                      <div style="margin-bottom: ${idx < evento.diagnosticos.length - 1 ? '1rem' : '0'}; padding: 0.75rem; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #1976d2;">
                        <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem;">
                          ${diag.medico ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Médico:</strong>
                              <span style="color: #555;">${diag.medico}</span>
                            </div>
                          ` : ''}
                          ${diag.especialidad ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Especialidad:</strong>
                              <span style="color: #555;">${diag.especialidad}</span>
                            </div>
                          ` : ''}
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Fecha:</strong>
                            <span style="color: #555;">${fechaDiag}</span>
                          </div>
                          ${diag.diagnostico ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Diagnóstico:</strong>
                              <span style="color: #555;">${diag.diagnostico}</span>
                            </div>
                          ` : ''}
                          ${diag.sintomas ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Síntomas:</strong>
                              <span style="color: #555;">${diag.sintomas}</span>
                            </div>
                          ` : ''}
                          ${diag.observaciones ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Observaciones:</strong>
                              <span style="color: #555;">${diag.observaciones}</span>
                            </div>
                          ` : ''}
                          ${diag.tieneReceta && diag.receta.length > 0 ? `
                            <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #dee2e6;">
                              <strong style="color: #333; display: block; margin-bottom: 0.5rem;">Medicación prescrita:</strong>
                              <ul style="margin: 0; padding-left: 1.5rem; color: #555;">
                                ${diag.receta.map(med => `
                                  <li>${med.nombre} - ${med.dosis} (${med.frecuencia}) por ${med.duracion}</li>
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
                <div>
                  <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #1976d2; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-vials"></i>
                    Resultados de análisis relacionados (${evento.resultados.length})
                  </h4>
                  ${evento.resultados.map((res, idx) => {
                    const fechaRes = new Date(res.fecha).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    });
                    const urlResultado = res.archivoPDF ? `http://localhost:5000${res.archivoPDF}` : '';
                    return `
                      <div style="margin-bottom: ${idx < evento.resultados.length - 1 ? '1rem' : '0'}; padding: 0.75rem; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #1976d2;">
                        <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem;">
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Tipo de examen:</strong>
                            <span style="color: #555;">${res.tipoExamen || 'N/A'}</span>
                          </div>
                          <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Fecha:</strong>
                            <span style="color: #555;">${fechaRes}</span>
                          </div>
                          ${res.observaciones ? `
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Observaciones:</strong>
                              <span style="color: #555;">${res.observaciones}</span>
                            </div>
                          ` : ''}
                          ${res.estado ? `
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                              <strong style="color: #333; min-width: 100px; flex-shrink: 0;">Estado:</strong>
                              <span style="color: #555; text-transform: capitalize;">${res.estado}</span>
                            </div>
                          ` : ''}
                          ${urlResultado ? `
                            <div style="margin-top: 0.5rem;">
                              <a href="javascript:void(0)" onclick="window.verResultadoPDF('${res.id}', '${res.nombreArchivo || 'Resultado'}')" style="display: inline-flex; align-items: center; gap: 0.4rem; color: #1976d2; text-decoration: none; font-weight: 500; cursor: pointer;">
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
          ` : ''}
        `;
      }

      item.innerHTML = `
        <div class="timeline-icon"><i class="fa-solid ${icono}"></i></div>
        <div class="timeline-content">
          ${contenidoHTML}
        </div>
      `;

      timelineEl.appendChild(item);
    });
  };

  // ============================================================
  // 🔹 FUNCIONES GLOBALES PARA INFORMACIÓN MÉDICA
  // ============================================================
  
  // Función global para editar información médica desde el perfil del paciente
  window.editarInformacionMedicaPaciente = async function(email) {
    if (!email) {
      alert("No se encontró el email del usuario");
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
    editModal.style.cssText = "position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); z-index: 1000;";
    editModal.innerHTML = `
      <div style="background: #fff; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 2px solid #e5e7eb;">
          <h3 style="margin: 0; color: #1a1a1a; font-size: 1.5rem; font-weight: 700;">Editar Información Médica Básica</h3>
          <button type="button" onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div style="padding: 1.5rem;">
          <form id="form-info-medica-paciente">
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Alergias (separadas por comas)</label>
              <textarea id="input-alergias-paciente" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit;" placeholder="Ej: Penicilina, Polen, Látex">${(infoMedica.alergias || []).join(', ')}</textarea>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Medicamentos Actuales (separados por comas)</label>
              <textarea id="input-medicamentos-paciente" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit;" placeholder="Ej: Metformina 500mg, Aspirina 100mg">${(infoMedica.medicamentosActuales || []).join(', ')}</textarea>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Condiciones Médicas (separadas por comas)</label>
              <textarea id="input-condiciones-paciente" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit;" placeholder="Ej: Diabetes tipo 2, Hipertensión">${(infoMedica.condicionesMedicas || []).join(', ')}</textarea>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Grupo Sanguíneo</label>
              <select id="input-grupo-sanguineo-paciente" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit; background: white;">
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
                  <input type="text" id="input-contacto-nombre-paciente" value="${infoMedica.contactoEmergencia?.nombre || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit;" placeholder="Nombre completo">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Relación</label>
                    <input type="text" id="input-contacto-relacion-paciente" value="${infoMedica.contactoEmergencia?.relacion || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit;" placeholder="Ej: Esposo/a, Padre, etc.">
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Teléfono</label>
                    <input type="text" id="input-contacto-telefono-paciente" value="${infoMedica.contactoEmergencia?.telefono || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit;" placeholder="9 dígitos">
                  </div>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Notas Médicas</label>
              <textarea id="input-notas-paciente" rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit;" placeholder="Notas adicionales sobre el paciente...">${infoMedica.notasMedicas || ''}</textarea>
            </div>
          </form>
        </div>
        <div style="display: flex; gap: 0.75rem; padding: 1.5rem; border-top: 2px solid #e5e7eb; justify-content: flex-end;">
          <button type="button" onclick="this.closest('.modal').remove()" style="padding: 0.75rem 1.5rem; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
            Cancelar
          </button>
          <button type="button" id="btn-guardar-info-medica-paciente" style="padding: 0.75rem 1.5rem; background: #1976d2; color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.background='#1565c0'" onmouseout="this.style.background='#1976d2'">
            <i class="fa-solid fa-save"></i> Guardar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(editModal);

    // Manejar guardado
    document.getElementById("btn-guardar-info-medica-paciente").onclick = async () => {
      const alergiasText = document.getElementById("input-alergias-paciente").value.trim();
      const medicamentosText = document.getElementById("input-medicamentos-paciente").value.trim();
      const condicionesText = document.getElementById("input-condiciones-paciente").value.trim();
      
      const alergias = alergiasText ? alergiasText.split(',').map(a => a.trim()).filter(a => a) : [];
      const medicamentos = medicamentosText ? medicamentosText.split(',').map(m => m.trim()).filter(m => m) : [];
      const condiciones = condicionesText ? condicionesText.split(',').map(c => c.trim()).filter(c => c) : [];

      const datos = {
        informacionMedica: {
          alergias,
          medicamentosActuales: medicamentos,
          condicionesMedicas: condiciones,
          grupoSanguineo: document.getElementById("input-grupo-sanguineo-paciente").value,
          contactoEmergencia: {
            nombre: document.getElementById("input-contacto-nombre-paciente").value.trim(),
            relacion: document.getElementById("input-contacto-relacion-paciente").value.trim(),
            telefono: document.getElementById("input-contacto-telefono-paciente").value.trim(),
          },
          notasMedicas: document.getElementById("input-notas-paciente").value.trim(),
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
          throw new Error(errorData.message || errorData.error || "Error al guardar la información médica");
        }

        alert("Información médica guardada correctamente");
        editModal.remove();
        // Recargar perfil para mostrar la información actualizada
        cargarPerfil(email);
      } catch (error) {
        console.error("Error al guardar información médica:", error);
        alert(error.message || "No se pudo guardar la información médica");
      }
    };
  };

  // ============================================================
  // 🔹 CONFIGURACIÓN DEL AVATAR DEL TOPBAR
  // ============================================================
  const topbarAvatar = document.getElementById("topbar-avatar");
  if (topbarAvatar) {
    topbarAvatar.style.cursor = "pointer";
    topbarAvatar.addEventListener("click", () => {
      loadSection("profile");
    });
  }

  // ============================================================
  // 🔹 CARGA INICIAL
  // ============================================================
  loadSection("overview");
  cargarAvatarUsuario(); // Cargar avatar del usuario al iniciar
  inicializarRecordatoriosGlobal(); // Inicializar sistema de recordatorios
  if (isMobile()) sidebar.classList.remove("open");
  else sidebar.classList.remove("collapsed");
});

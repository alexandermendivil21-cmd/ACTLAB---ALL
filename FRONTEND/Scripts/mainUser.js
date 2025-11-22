// Scripts/mainUser.js

document.addEventListener("DOMContentLoaded", () => {
  // Recuperar usuario del localStorage
  const usuario = localStorage.getItem("usuario") || "Paciente";

  // Mostrar en el header
  document.getElementById("username").textContent = usuario;

  // Mostrar en la sección de solicitar cita
  const pacienteSpan = document.getElementById("paciente");
  if (pacienteSpan) {
    pacienteSpan.textContent = usuario;
  }

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
            from { opacity: 0; }
            to { opacity: 1; }
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

  // Función para cerrar sesión (compatible con la función global)
  const cerrarSesion = function() {
    mostrarModalCerrarSesion(() => {
      // Limpiar todos los datos de sessionStorage
      sessionStorage.clear();
      
      // Limpiar datos específicos de localStorage relacionados con la sesión
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userCargo");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userNombres");
      localStorage.removeItem("userApellidos");
      
      // Redirigir al login
      window.location.href = "login.html";
    });
  };

  // Hacer la función disponible globalmente
  window.cerrarSesion = cerrarSesion;

  // Botón de cerrar sesión
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      cerrarSesion();
    });
  }
});

// public/admin-layout.js
// Verificar permisos antes de que el DOM esté completamente cargado
(function() {
  const userCargo = sessionStorage.getItem("userCargo");
  const currentPath = window.location.pathname;
  
  // Si el usuario es médico, verificar acceso a páginas restringidas
  if (userCargo === "medico") {
    const restrictedPages = [
      "/admin",           // Inicio
      "/admin/pacientes", // Pacientes
      "/admin/personal",  // Personal
      "/admin/resultados", // Resultados
      "/admin/pagos",     // Pagos
      "/admin/reportes"   // Reportes
    ];
    
    // Si el usuario médico está en una página no permitida, redirigir inmediatamente
    if (restrictedPages.includes(currentPath)) {
      window.location.href = "/admin/citas";
      return;
    }
  }
  
  // Si el usuario es técnico, solo permitir citas, resultados y perfil
  if (userCargo === "tecnico") {
    const allowedPages = [
      "/admin/citas",         // Citas (permitida)
      "/admin/resultados",    // Resultados (permitida)
      "/admin/perfil-tecnico" // Perfil técnico (permitida)
    ];
    
    // Si el técnico está en una página no permitida, redirigir a resultados
    if (!allowedPages.includes(currentPath) && currentPath.startsWith("/admin")) {
      window.location.href = "/admin/resultados";
      return;
    }
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      if (window.innerWidth <= 768) sidebar.classList.toggle("open");
      else sidebar.classList.toggle("collapsed");
    });
  }

  // Verificar si el usuario es médico o técnico
  const userCargo = sessionStorage.getItem("userCargo");
  
  // Si el usuario es médico, ocultar elementos del menú restringidos
  if (userCargo === "medico") {
    const menuItemsToHide = [
      "/admin",           // Inicio
      "/admin/pacientes", // Pacientes
      "/admin/personal",  // Personal
      "/admin/resultados", // Resultados
      "/admin/pagos",     // Pagos
      "/admin/reportes"   // Reportes
    ];
    
    // Ocultar elementos del menú según el cargo
    document.querySelectorAll(".nav-item").forEach((link) => {
      const href = link.getAttribute("href");
      if (menuItemsToHide.includes(href)) {
        link.style.display = "none";
      }
    });
    
    // Mostrar el enlace de perfil solo para médicos
    document.querySelectorAll('a[href="/admin/perfil"]').forEach((link) => {
      link.style.display = "flex";
    });
  } 
  // Si el usuario es técnico, solo mostrar citas, resultados y perfil
  else if (userCargo === "tecnico") {
    const allowedMenuItems = [
      "/admin/citas",         // Citas (permitida)
      "/admin/resultados",    // Resultados (permitida)
      "/admin/perfil-tecnico" // Perfil técnico (permitida)
    ];
    
    // Ocultar todos los elementos del menú excepto citas, resultados y perfil
    document.querySelectorAll(".nav-item").forEach((link) => {
      const href = link.getAttribute("href");
      // Mantener visible solo citas, resultados y perfil, ocultar todo lo demás
      if (href && !allowedMenuItems.includes(href) && href !== "/login") {
        link.style.display = "none";
      } else if (allowedMenuItems.includes(href)) {
        link.style.display = "flex";
      }
    });
    
    // Cambiar el enlace de /admin/perfil a /admin/perfil-tecnico si existe
    document.querySelectorAll('a[href="/admin/perfil"]').forEach((link) => {
      link.href = "/admin/perfil-tecnico";
      link.style.display = "flex";
    });
    
    // Asegurar que el botón de salir esté visible
    document.querySelectorAll('a[href="/login"]').forEach((link) => {
      link.style.display = "flex";
    });
  } 
  // Si no es médico ni técnico (admin), ocultar el enlace de perfil (solo para médicos)
  else {
    document.querySelectorAll('a[href="/admin/perfil"]').forEach((link) => {
      link.style.display = "none";
    });
  }

  // Enlace activo según URL
  const currentPath = window.location.pathname;
  document.querySelectorAll(".nav-item").forEach((link) => {
    if (link.getAttribute("href") === currentPath && link.style.display !== "none") {
      link.classList.add("active");
    }
  });

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
      
      // Redirigir al login
      window.location.href = "/login";
    });
  };

  // Configurar enlaces de logout para que usen la función cerrarSesion
  document.querySelectorAll('a[href="/login"], a[href="/"], a[href*="logout"]').forEach((link) => {
    // Verificar si el enlace está en el footer o sidebar (botón de salir)
    const isLogoutLink = link.closest('.sidebar-footer') || 
                        link.textContent.toLowerCase().includes('salir') ||
                        link.textContent.toLowerCase().includes('logout') ||
                        link.getAttribute('href') === '/login' ||
                        link.getAttribute('href') === '/';
    
    if (isLogoutLink) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.cerrarSesion();
      });
    }
  });
});

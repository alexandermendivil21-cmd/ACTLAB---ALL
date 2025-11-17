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
});

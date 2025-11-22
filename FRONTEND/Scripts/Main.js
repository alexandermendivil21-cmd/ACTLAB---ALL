// ==============================
// MAIN.JS 
// ==============================
const API = 'http://localhost:5000/api';
let token, role, name;

// -------------------------------
// Helpers  - parte de back
// -------------------------------
async function request(path, method = 'GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return res.json();
}

// -------------------------------
// Auth flow - login, sesiones
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("login-btn")) {
    document.getElementById("login-btn").onclick = function () {
      window.location.href = "login.html";
    };
  }

  if (location.pathname.endsWith('index.html') || location.pathname === '/') {
    document.getElementById('form-title').innerText = 'Iniciar Sesión';
    document.getElementById('submit-btn').innerText = 'Ingresar';

    document.getElementById('submit-btn').onclick = async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const data = await request('/auth/login', 'POST', { email, password });

      if (data.token) {
        token = data.token;
        role = data.role;
        name = data.name;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('name', name);
        window.location = role === 'admin' ? 'admin.html' : 'user.html';
      } else {
        alert(data.msg);
      }
    };
  }

// CARGA INICIAL (user.html & admin.html)
if (token = localStorage.getItem('token')) {
  role = localStorage.getItem('role');
  name = localStorage.getItem('name');

  if (role === 'user' && location.pathname.endsWith('user.html')) {
    initUser();
  }

  if (role === 'admin' && location.pathname.endsWith('admin.html')) {
    initAdmin();
  }
} else {
    if (!location.pathname.endsWith('login.html')) {
    window.location = 'index.html';  
  }
}


  // -------------------------------
  // UX/UI Enhancements
  // -------------------------------
  const navToggle = document.querySelector('.nav-toggle');
  const menuList = document.getElementById('menu-list');

  if (navToggle && menuList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      menuList.classList.toggle('open');
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (menuList && menuList.classList.contains('open')) {
          menuList.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // IntersectionObserver
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.12 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('inview');
    });
  }, observerOptions);
  document.querySelectorAll('[data-anim]').forEach(el => observer.observe(el));
});

// -------------------------------
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

// Función global para cerrar sesión
window.cerrarSesion = function() {
  mostrarModalCerrarSesion(() => {
    // Limpiar todos los datos de sessionStorage
    sessionStorage.clear();
    
    // Limpiar datos específicos de localStorage relacionados con la sesión
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("usuario");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userCargo");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userNombres");
    localStorage.removeItem("userApellidos");
    
    // Redirigir al login
    window.location = 'index.html';
  });
};

// USER PAGE
// -------------------------------
async function initUser() {
  const me = await request('/auth/me');
  document.getElementById('welcome').innerText = `Hola, ${me.name}`;
  document.getElementById('logout').onclick = () => {
    window.cerrarSesion();
  };

  document.getElementById('req-appt').onclick = async (e) => {
  e.preventDefault(); // 🔥 Evita que se recargue la página
  const date = document.getElementById('appt-date').value;
  if (!date) return alert("Selecciona una fecha para la cita");
  await request('/appointments', 'POST', { date });
  loadAppts();
};


  document.getElementById('upd-profile').onclick = async () => {
    const name = document.getElementById('new-name').value;
    const password = document.getElementById('new-pass').value;
    await request('/auth/me', 'PUT', { name, password });
    alert('Perfil actualizado');
  };

  async function loadAppts() {
    const list = await request('/appointments');
    const apptList = document.getElementById('appt-list');
    apptList.innerHTML = list.map(a =>
      `<li>${new Date(a.date).toLocaleString()} - ${a.status}</li>`).join('');
  }
  loadAppts();
}

// -------------------------------
// ADMIN PAGE
// -------------------------------
async function initAdmin() {
  document.getElementById('logout').onclick = () => {
    window.cerrarSesion();
  };

  const list = await request('/appointments/all');
  const allAppts = document.getElementById('all-appts');
  allAppts.innerHTML = list.map(a => {
    return `<tr>
      <td>${a.user.name} (${a.user.email})</td>
      <td>${new Date(a.date).toLocaleString()}</td>
      <td>${a.status}</td>
      <td>
        <button onclick="change('${a._id}', 'confirmed')">✅</button>
        <button onclick="change('${a._id}', 'cancelled')">❌</button>
      </td>
    </tr>`;
  }).join('');

  window.change = async (id, status) => {
    await request(`/appointments/${id}`, 'PUT', { status });
    initAdmin();
  };
}

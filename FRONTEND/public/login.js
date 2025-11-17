// public/login.js

const mensajeError = document.getElementsByClassName("error")[0];
const form = document.getElementById("login_form");

// Cargar datos guardados al iniciar la página
window.addEventListener("DOMContentLoaded", () => {
  const recordar = localStorage.getItem("recordar");
  
  if (recordar === "true") {
    const tipoDoc = localStorage.getItem("tipo_documento");
    const numDoc = localStorage.getItem("num_documento");
    
    if (tipoDoc) {
      form.elements["tipo-documento"].value = tipoDoc;
    }
    if (numDoc) {
      form.elements["num-documento"].value = numDoc;
    }
    form.elements["remember"].checked = true;
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const elems = form.elements;
  const recordar = elems["remember"].checked;
  
  const payload = {
    tipo_documento: elems["tipo-documento"].value,
    num_documento:   elems["num-documento"].value,
    password:        elems["password"].value
  };

  // Guardar o eliminar datos según el checkbox
  if (recordar) {
    localStorage.setItem("recordar", "true");
    localStorage.setItem("tipo_documento", payload.tipo_documento);
    localStorage.setItem("num_documento", payload.num_documento);
  } else {
    localStorage.removeItem("recordar");
    localStorage.removeItem("tipo_documento");
    localStorage.removeItem("num_documento");
  }

  try {
    const res = await fetch("/api/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      mensajeError.textContent = data.message || "Error al iniciar sesión.";
      mensajeError.classList.remove("escondido");
      return;
    }

    // Limpiar datos de sesión del usuario anterior para evitar conflictos
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userCargo");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userNombres");
    sessionStorage.removeItem("userApellidos");
    
    // Guardar token para llamadas autenticadas posteriores
    localStorage.setItem("token", data.token);
    
    // Guardar información del usuario actual
    if (data.email) {
      sessionStorage.setItem("userEmail", data.email);
    }
    if (data.role) {
      sessionStorage.setItem("userRole", data.role);
    }
    if (data.cargo) {
      sessionStorage.setItem("userCargo", data.cargo);
    } else {
      // Si no hay cargo (como en el caso del admin), asegurarse de que no quede uno anterior
      sessionStorage.removeItem("userCargo");
    }
    if (data.nombres) {
      sessionStorage.setItem("userNombres", data.nombres);
    }
    if (data.apellidos) {
      sessionStorage.setItem("userApellidos", data.apellidos);
    }

    // Redirigir al área admin
    window.location.href = data.redirect || "/admin";
  } catch (err) {
    console.error("Error en fetch:", err);
    mensajeError.textContent = "No se pudo conectar al servidor.";
    mensajeError.classList.remove("escondido");
  }
});
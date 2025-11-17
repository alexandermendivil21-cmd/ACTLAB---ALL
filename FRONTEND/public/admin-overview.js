// Función reutilizable para cargar y actualizar las alertas de citas
async function cargarAlertasCitas() {
  try {
    // Usar la ruta correcta del admin: /api/admin/citas/contar/estados
    const res = await fetch("/api/admin/citas/contar/estados");
    if (res.ok) {
      const data = await res.json();
      
      // Actualizar alerta de citas confirmadas
      const textoCitasConfirmadas = document.getElementById("textoCitasConfirmadas");
      if (textoCitasConfirmadas) {
        const cantidad = data.citasConfirmadas || 0;
        textoCitasConfirmadas.textContent = `${cantidad} ${cantidad === 1 ? 'cita confirmada' : 'citas confirmadas'}`;
      }
      
      // Actualizar alerta de citas canceladas por pacientes
      const textoCitasCanceladas = document.getElementById("textoCitasCanceladas");
      const alertaCitasCanceladas = document.getElementById("alertaCitasCanceladas");
      if (textoCitasCanceladas && alertaCitasCanceladas) {
        const cantidad = data.citasCanceladas || 0;
        textoCitasCanceladas.textContent = `${cantidad} ${cantidad === 1 ? 'cita cancelada por paciente' : 'citas canceladas por pacientes'}`;
        // Siempre mostrar la alerta, incluso si es 0 (para que el admin vea que no hay cancelaciones)
        alertaCitasCanceladas.style.display = 'flex';
      }
      
      // Actualizar alerta de citas pendientes
      const textoCitasPendientes = document.getElementById("textoCitasPendientes");
      if (textoCitasPendientes) {
        const cantidad = data.citasPendientes || 0;
        textoCitasPendientes.textContent = `${cantidad} ${cantidad === 1 ? 'cita pendiente' : 'citas pendientes'}`;
      }
      
      // Actualizar alerta de citas cambiadas por pacientes
      const textoCitasCambiadas = document.getElementById("textoCitasCambiadas");
      const alertaCitasCambiadas = document.getElementById("alertaCitasCambiadas");
      if (textoCitasCambiadas && alertaCitasCambiadas) {
        const cantidad = data.citasCambiadas || 0;
        textoCitasCambiadas.textContent = `${cantidad} ${cantidad === 1 ? 'cita cambiada por paciente' : 'citas cambiadas por pacientes'}`;
        // Siempre mostrar la alerta, incluso si es 0 (para que el admin vea que no hay cambios)
        alertaCitasCambiadas.style.display = 'flex';
      }
      
      console.log("✅ Alertas de citas actualizadas:", data);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error("Error al cargar datos de alertas de citas:", res.status, errorData);
    }
  } catch (error) {
    console.error("Error al cargar datos de alertas de citas:", error);
  }
}

// Función para cargar estadísticas generales de citas
async function cargarEstadisticasCitas() {
  try {
    const res = await fetch("/api/admin/citas/estadisticas");
    if (res.ok) {
      const data = await res.json();
      
      // Actualizar total de citas reservadas
      const citasTotal = document.getElementById("citas-total");
      if (citasTotal) {
        citasTotal.textContent = data.totalCitas || 0;
      }
      
      // Actualizar información adicional (citas del día y nuevas hoy)
      const citasDiaInfo = document.getElementById("citas-dia-info");
      if (citasDiaInfo) {
        const citasDelDia = data.citasDelDia || 0;
        const citasNuevasHoy = data.citasNuevasHoy || 0;
        
        if (citasNuevasHoy > 0) {
          citasDiaInfo.textContent = `${citasDelDia} hoy · +${citasNuevasHoy} nuevas`;
        } else {
          citasDiaInfo.textContent = `${citasDelDia} citas programadas para hoy`;
        }
      }
      
      console.log("✅ Estadísticas de citas cargadas:", data);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error("Error al cargar estadísticas de citas:", res.status, errorData);
      
      // Mostrar valores por defecto en caso de error
      const citasTotal = document.getElementById("citas-total");
      const citasDiaInfo = document.getElementById("citas-dia-info");
      if (citasTotal) citasTotal.textContent = "0";
      if (citasDiaInfo) citasDiaInfo.textContent = "Error al cargar";
    }
  } catch (error) {
    console.error("Error al cargar estadísticas de citas:", error);
    
    // Mostrar valores por defecto en caso de error
    const citasTotal = document.getElementById("citas-total");
    const citasDiaInfo = document.getElementById("citas-dia-info");
    if (citasTotal) citasTotal.textContent = "0";
    if (citasDiaInfo) citasDiaInfo.textContent = "Error al cargar";
  }
}

// Función para cargar estadísticas de pacientes
async function cargarEstadisticasPacientes() {
  try {
    const res = await fetch("/api/pacientes/estadisticas");
    if (res.ok) {
      const data = await res.json();
      
      // Actualizar total de pacientes registrados
      const pacientesTotal = document.getElementById("pacientes-total");
      if (pacientesTotal) {
        pacientesTotal.textContent = data.totalPacientes || 0;
      }
      
      // Actualizar información adicional (pacientes nuevos esta semana)
      const pacientesInfo = document.getElementById("pacientes-info");
      if (pacientesInfo && data.pacientesNuevosSemana !== undefined) {
        const nuevosSemana = data.pacientesNuevosSemana || 0;
        if (nuevosSemana > 0) {
          pacientesInfo.textContent = `${nuevosSemana} nuevos esta semana`;
        } else {
          pacientesInfo.textContent = "Sin nuevos pacientes esta semana";
        }
      }
      
      console.log("✅ Estadísticas de pacientes cargadas:", data);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error("Error al cargar estadísticas de pacientes:", res.status, errorData);
      
      // Mostrar valores por defecto en caso de error
      const pacientesTotal = document.getElementById("pacientes-total");
      const pacientesInfo = document.getElementById("pacientes-info");
      if (pacientesTotal) pacientesTotal.textContent = "0";
      if (pacientesInfo) pacientesInfo.textContent = "Error al cargar";
    }
  } catch (error) {
    console.error("Error al cargar estadísticas de pacientes:", error);
    
    // Mostrar valores por defecto en caso de error
    const pacientesTotal = document.getElementById("pacientes-total");
    const pacientesInfo = document.getElementById("pacientes-info");
    if (pacientesTotal) pacientesTotal.textContent = "0";
    if (pacientesInfo) pacientesInfo.textContent = "Error al cargar";
  }
}

// Función para cargar estadísticas de resultados
async function cargarEstadisticasResultados() {
  try {
    const res = await fetch("/api/admin/resultados/estadisticas");
    if (res.ok) {
      const data = await res.json();
      
      // Actualizar total de resultados emitidos
      const resultadosTotal = document.getElementById("resultados-total");
      if (resultadosTotal) {
        resultadosTotal.textContent = data.totalResultados || 0;
      }
      
      // Actualizar información adicional (resultados en las últimas 24h)
      const resultadosInfo = document.getElementById("resultados-info");
      if (resultadosInfo && data.resultadosUltimas24h !== undefined) {
        const ultimas24h = data.resultadosUltimas24h || 0;
        if (ultimas24h > 0) {
          resultadosInfo.textContent = `${ultimas24h} en las últimas 24h`;
        } else {
          resultadosInfo.textContent = "Sin resultados en las últimas 24h";
        }
      }
      
      console.log("✅ Estadísticas de resultados cargadas:", data);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error("Error al cargar estadísticas de resultados:", res.status, errorData);
      
      // Mostrar valores por defecto en caso de error
      const resultadosTotal = document.getElementById("resultados-total");
      const resultadosInfo = document.getElementById("resultados-info");
      if (resultadosTotal) resultadosTotal.textContent = "0";
      if (resultadosInfo) resultadosInfo.textContent = "Error al cargar";
    }
  } catch (error) {
    console.error("Error al cargar estadísticas de resultados:", error);
    
    // Mostrar valores por defecto en caso de error
    const resultadosTotal = document.getElementById("resultados-total");
    const resultadosInfo = document.getElementById("resultados-info");
    if (resultadosTotal) resultadosTotal.textContent = "0";
    if (resultadosInfo) resultadosInfo.textContent = "Error al cargar";
  }
}

// Función para cargar estadísticas de pagos
async function cargarEstadisticasPagos() {
  try {
    const res = await fetch("/api/pagos/estadisticas");
    if (res.ok) {
      const data = await res.json();
      
      // Actualizar total de pagos recibidos (monto total)
      const pagosTotal = document.getElementById("pagos-total");
      if (pagosTotal) {
        const montoTotal = parseFloat(data.montoTotal || 0);
        pagosTotal.textContent = `S/ ${montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      
      // Actualizar información adicional (pagos de hoy)
      const pagosInfo = document.getElementById("pagos-info");
      if (pagosInfo && data.pagosHoy !== undefined && data.montoHoy !== undefined) {
        const pagosHoy = data.pagosHoy || 0;
        const montoHoy = parseFloat(data.montoHoy || 0);
        
        if (pagosHoy > 0) {
          pagosInfo.textContent = `${pagosHoy} ${pagosHoy === 1 ? 'pago' : 'pagos'} hoy · S/ ${montoHoy.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
          pagosInfo.textContent = "Sin pagos hoy";
        }
      }
      
      console.log("✅ Estadísticas de pagos cargadas:", data);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error("Error al cargar estadísticas de pagos:", res.status, errorData);
      
      // Mostrar valores por defecto en caso de error
      const pagosTotal = document.getElementById("pagos-total");
      const pagosInfo = document.getElementById("pagos-info");
      if (pagosTotal) pagosTotal.textContent = "S/ 0.00";
      if (pagosInfo) pagosInfo.textContent = "Error al cargar";
    }
  } catch (error) {
    console.error("Error al cargar estadísticas de pagos:", error);
    
    // Mostrar valores por defecto en caso de error
    const pagosTotal = document.getElementById("pagos-total");
    const pagosInfo = document.getElementById("pagos-info");
    if (pagosTotal) pagosTotal.textContent = "S/ 0.00";
    if (pagosInfo) pagosInfo.textContent = "Error al cargar";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Cargar estadísticas de citas al cargar la página
  await cargarEstadisticasCitas();
  
  // Cargar estadísticas de pacientes al cargar la página
  await cargarEstadisticasPacientes();
  
  // Cargar estadísticas de resultados al cargar la página
  await cargarEstadisticasResultados();
  
  // Cargar estadísticas de pagos al cargar la página
  await cargarEstadisticasPagos();
  
  // Cargar datos de alertas de citas al cargar la página
  await cargarAlertasCitas();
  
  // Recargar las estadísticas y alertas cada 30 segundos para mantenerlas actualizadas
  setInterval(cargarEstadisticasCitas, 30000);
  setInterval(cargarEstadisticasPacientes, 30000);
  setInterval(cargarEstadisticasResultados, 30000);
  setInterval(cargarEstadisticasPagos, 30000);
  setInterval(cargarAlertasCitas, 30000);
});

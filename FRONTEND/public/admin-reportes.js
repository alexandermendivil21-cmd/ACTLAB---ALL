// admin-reportes.js
// Script para la página de reportes del administrador

let chartCitasSemana, chartExamenes, chartPacientesMes;

// Función para cargar y mostrar citas de la semana
async function cargarCitasSemana() {
  try {
    const res = await fetch("/api/admin/citas/semana");
    if (!res.ok) {
      throw new Error("Error al cargar citas de la semana");
    }
    const datos = await res.json();
    
    const ctx1 = document.getElementById("chartCitasSemana");
    if (ctx1 && chartCitasSemana) {
      chartCitasSemana.destroy();
    }
    
    if (ctx1) {
      chartCitasSemana = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
          datasets: [
            {
              label: "Citas",
              data: datos,
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderRadius: 8,
            },
          ],
        },
        options: { 
          responsive: true, 
          plugins: { 
            legend: { display: false },
            title: {
              display: true,
              text: "Citas de la Semana Actual"
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        },
      });
    }
    
    console.log("✅ Citas de la semana cargadas:", datos);
  } catch (error) {
    console.error("Error al cargar citas de la semana:", error);
    
    // Mostrar gráfico con datos vacíos en caso de error
    const ctx1 = document.getElementById("chartCitasSemana");
    if (ctx1 && chartCitasSemana) {
      chartCitasSemana.destroy();
    }
    if (ctx1) {
      chartCitasSemana = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
          datasets: [
            {
              label: "Citas",
              data: [0, 0, 0, 0, 0, 0, 0],
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderRadius: 8,
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }
  }
}

// Función para cargar y mostrar exámenes más solicitados
async function cargarExamenesSolicitados() {
  try {
    const res = await fetch("/api/admin/resultados/examenes-solicitados");
    if (!res.ok) {
      throw new Error("Error al cargar exámenes solicitados");
    }
    const data = await res.json();
    
    const ctx2 = document.getElementById("chartExamenes");
    if (ctx2 && chartExamenes) {
      chartExamenes.destroy();
    }
    
    if (ctx2) {
      // Colores para los gráficos de dona
      const colores = [
        "#4F46E5",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#3B82F6",
        "#8B5CF6",
        "#EC4899",
        "#06B6D4",
        "#84CC16",
        "#F97316"
      ];
      
      chartExamenes = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: data.labels || [],
          datasets: [
            {
              data: data.datos || [],
              backgroundColor: colores.slice(0, data.labels?.length || 0),
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { 
            legend: { position: "bottom" },
            title: {
              display: true,
              text: "Exámenes Más Solicitados"
            }
          },
        },
      });
    }
    
    console.log("✅ Exámenes solicitados cargados:", data);
  } catch (error) {
    console.error("Error al cargar exámenes solicitados:", error);
    
    // Mostrar gráfico con datos vacíos en caso de error
    const ctx2 = document.getElementById("chartExamenes");
    if (ctx2 && chartExamenes) {
      chartExamenes.destroy();
    }
    if (ctx2) {
      chartExamenes = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
              backgroundColor: [],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }
  }
}

// Función para cargar y mostrar pacientes nuevos por mes
async function cargarPacientesPorMes() {
  try {
    const res = await fetch("/api/pacientes/por-mes");
    if (!res.ok) {
      throw new Error("Error al cargar pacientes por mes");
    }
    const data = await res.json();
    
    const ctx3 = document.getElementById("chartPacientesMes");
    if (ctx3 && chartPacientesMes) {
      chartPacientesMes.destroy();
    }
    
    if (ctx3) {
      chartPacientesMes = new Chart(ctx3, {
        type: "line",
        data: {
          labels: data.labels || [],
          datasets: [
            {
              label: "Pacientes Nuevos",
              data: data.datos || [],
              borderColor: "#8B5CF6",
              backgroundColor: "rgba(139, 92, 246, 0.2)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { 
            legend: { display: false },
            title: {
              display: true,
              text: "Pacientes Nuevos por Mes (Últimos 6 Meses)"
            }
          },
          scales: { 
            y: { 
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            } 
          },
        },
      });
    }
    
    console.log("✅ Pacientes por mes cargados:", data);
  } catch (error) {
    console.error("Error al cargar pacientes por mes:", error);
    
    // Mostrar gráfico con datos vacíos en caso de error
    const ctx3 = document.getElementById("chartPacientesMes");
    if (ctx3 && chartPacientesMes) {
      chartPacientesMes.destroy();
    }
    if (ctx3) {
      chartPacientesMes = new Chart(ctx3, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Pacientes Nuevos",
              data: [],
              borderColor: "#8B5CF6",
              backgroundColor: "rgba(139, 92, 246, 0.2)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }
  }
}

// Cargar todos los gráficos cuando se carga la página
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    cargarCitasSemana(),
    cargarExamenesSolicitados(),
    cargarPacientesPorMes()
  ]);
});

